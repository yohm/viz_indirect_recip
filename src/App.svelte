<script lang="ts">
  import { onDestroy } from 'svelte'
  import ControlPanel from './components/ControlPanel.svelte'
  import CustomNormEditor from './components/CustomNormEditor.svelte'
  import EventLog from './components/EventLog.svelte'
  import MatrixView from './components/MatrixView.svelte'
  import SimulationControls from './components/SimulationControls.svelte'
  import StatsPanel from './components/StatsPanel.svelte'
  import TimeSeriesChart from './components/TimeSeriesChart.svelte'
  import { initializeSimulation } from './lib/sim/initialize'
  import { normalizeCustomNormCode } from './lib/sim/customNormCode'
  import {
    duplicatePresetAsCustom,
    listAvailableSocialNorms,
    resolveSocialNorm,
    validateCustomSocialNormCollection,
  } from './lib/sim/socialNormCatalog'
  import { DEFAULT_PARAMETERS, validateParameters } from './lib/sim/state'
  import { appendTimeSeriesPoint, computeStats, toTimeSeriesPoint } from './lib/sim/stats'
  import { stepSimulation } from './lib/sim/step'
  import type { CustomNormCode, SimulationParameters, SimulationState, TimeSeriesPoint } from './lib/sim/types'
  import { normalizeSettingsDocument, parseJson, toPrettyJson, type SimulationSettingsDocument } from './lib/utils/json'

  const MAX_CHART_POINTS = 500

  let editableParams: SimulationParameters = { ...DEFAULT_PARAMETERS }
  let customSocialNorms: CustomNormCode[] = []
  let appliedCustomSocialNorms: CustomNormCode[] = []
  let simState: SimulationState = initializeSimulation(validateParameters({ ...editableParams }, customSocialNorms))
  let stats = computeStats(simState)
  let statsHistory: TimeSeriesPoint[] = [toTimeSeriesPoint(stats)]
  let running = false
  let loopHandle: ReturnType<typeof setInterval> | null = null

  let feedback = ''
  let jsonText = ''
  let hasPendingChanges = false
  let editingCode: CustomNormCode | null = null
  let editingOriginalCode: CustomNormCode | null = null

  function cloneCustomNorms(norms: CustomNormCode[]): CustomNormCode[] {
    return norms.map((code) => normalizeCustomNormCode(code))
  }

  function areParametersEqual(a: SimulationParameters, b: SimulationParameters): boolean {
    return (
      a.numAgents === b.numAgents &&
      a.socialNormId === b.socialNormId &&
      a.assessmentMode === b.assessmentMode &&
      a.observationProbability === b.observationProbability &&
      a.actionErrorProbability === b.actionErrorProbability &&
      a.assessmentErrorProbability === b.assessmentErrorProbability &&
      a.initialReputationMode === b.initialReputationMode &&
      a.seed === b.seed &&
      a.autoplayStepsPerSecond === b.autoplayStepsPerSecond &&
      a.maxEventLogSize === b.maxEventLogSize
    )
  }

  function areCustomNormCollectionsEqual(a: CustomNormCode[], b: CustomNormCode[]): boolean {
    return JSON.stringify(a) === JSON.stringify(b)
  }

  function applyParams(updated: SimulationParameters): void {
    editableParams = updated
  }

  function resetSimulation(): void {
    try {
      validateCustomSocialNormCollection(customSocialNorms)
      const validated = validateParameters({ ...editableParams }, customSocialNorms)
      editableParams = validated
      simState = initializeSimulation(validated)
      appliedCustomSocialNorms = cloneCustomNorms(customSocialNorms)
      stats = computeStats(simState)
      statsHistory = [toTimeSeriesPoint(stats)]
      feedback = `Initialized with seed ${validated.seed}.`
    } catch (error) {
      feedback = (error as Error).message
      stopLoop()
    }
  }

  function stepOnce(): void {
    try {
      const { nextState } = stepSimulation(simState, appliedCustomSocialNorms)
      simState = nextState
      stats = computeStats(simState)
      statsHistory = appendTimeSeriesPoint(statsHistory, toTimeSeriesPoint(stats), MAX_CHART_POINTS)
      feedback = ''
    } catch (error) {
      feedback = (error as Error).message
      stopLoop()
    }
  }

  function startLoop(): void {
    stopLoop()
    const hz = Math.max(1, Math.floor(editableParams.autoplayStepsPerSecond))
    const intervalMs = Math.max(1, Math.floor(1000 / hz))
    loopHandle = setInterval(() => stepOnce(), intervalMs)
    running = true
  }

  function stopLoop(): void {
    if (loopHandle) {
      clearInterval(loopHandle)
      loopHandle = null
    }
    running = false
  }

  function toggleRun(): void {
    if (running) {
      stopLoop()
    } else {
      startLoop()
    }
  }

  function exportSettings(): void {
    jsonText = toPrettyJson({
      version: 2,
      parameters: editableParams,
      customSocialNorms,
    })

    const blob = new Blob([jsonText], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'simulation-settings.json'
    anchor.click()
    URL.revokeObjectURL(url)

    feedback = 'Exported settings JSON.'
  }

  function importSettings(): void {
    try {
      const parsed = parseJson<SimulationSettingsDocument>(jsonText)
      const normalized = normalizeSettingsDocument(parsed)
      validateCustomSocialNormCollection(normalized.customSocialNorms)
      const merged = validateParameters({
        ...DEFAULT_PARAMETERS,
        ...editableParams,
        ...normalized.parameters,
      }, normalized.customSocialNorms)
      customSocialNorms = cloneCustomNorms(normalized.customSocialNorms)
      editableParams = merged
      resetSimulation()
      feedback = 'Imported settings and re-initialized simulation.'
    } catch (error) {
      feedback = `Import failed: ${(error as Error).message}`
    }
  }

  function onJsonChange(value: string): void {
    jsonText = value
  }

  function ensureUniqueCustomNorm(code: CustomNormCode, excludingCode: string | null = null): void {
    const normalized = normalizeCustomNormCode(code)
    const duplicate = customSocialNorms.some(
      (item) => item === normalized && (excludingCode === null || item !== normalizeCustomNormCode(excludingCode)),
    )
    if (duplicate) {
      throw new Error(`Custom norm code already exists: ${normalized}`)
    }
  }

  function openEditor(code: CustomNormCode, originalCode: CustomNormCode | null): void {
    editingCode = normalizeCustomNormCode(code)
    editingOriginalCode = originalCode ? normalizeCustomNormCode(originalCode) : null
  }

  function createCustomNorm(): void {
    openEditor(duplicatePresetAsCustom('image-scoring'), null)
  }

  function duplicateSelectedNorm(): void {
    const selected = resolveSocialNorm(editableParams.socialNormId, customSocialNorms)
    const duplicatedCode = selected.source === 'custom' ? selected.id : duplicatePresetAsCustom(selected.id)
    openEditor(duplicatedCode, null)
  }

  function saveCustomNorm(updatedCode: CustomNormCode): void {
    try {
      const normalized = normalizeCustomNormCode(updatedCode)
      validateCustomSocialNormCollection([normalized])

      if (editingOriginalCode === null) {
        ensureUniqueCustomNorm(normalized)
        customSocialNorms = [...customSocialNorms, normalized]
      } else {
        ensureUniqueCustomNorm(normalized, editingOriginalCode)
        customSocialNorms = customSocialNorms.map((item) => (item === editingOriginalCode ? normalized : item))
      }

      editableParams = {
        ...editableParams,
        socialNormId: normalized,
      }
      editingCode = normalized
      editingOriginalCode = normalized
      feedback = `Saved custom norm ${normalized}.`
    } catch (error) {
      feedback = (error as Error).message
    }
  }

  function deleteCustomNorm(code: CustomNormCode): void {
    const normalized = normalizeCustomNormCode(code)
    customSocialNorms = customSocialNorms.filter((item) => item !== normalized)
    if (editableParams.socialNormId === normalized) {
      editableParams = { ...editableParams, socialNormId: DEFAULT_PARAMETERS.socialNormId }
    }
    editingCode = null
    editingOriginalCode = null
  }

  function editSelectedNorm(): void {
    openEditor(editableParams.socialNormId, editableParams.socialNormId)
  }

  $: socialNormOptions = listAvailableSocialNorms(customSocialNorms)
  $: selectedNorm = resolveSocialNorm(editableParams.socialNormId, customSocialNorms)
  $: selectedNormLabel = selectedNorm.source === 'custom' ? selectedNorm.id : selectedNorm.name
  $: hasPendingChanges =
    !areParametersEqual(editableParams, simState.params) ||
    !areCustomNormCollectionsEqual(customSocialNorms, appliedCustomSocialNorms)

  onDestroy(() => {
    stopLoop()
  })
</script>

<main>
  <h1>Indirect Reciprocity Simulator</h1>

  <div class="top-controls">
    <SimulationControls
      {running}
      {hasPendingChanges}
      on:reset={resetSimulation}
      on:step={stepOnce}
      on:toggleRun={toggleRun}
    />
  </div>

  <div class="layout">
    <div class="left-col">
      <ControlPanel
        params={editableParams}
        socialNormOptions={socialNormOptions}
        selectedNormDescription={selectedNormLabel}
        selectedNormSource={selectedNorm.source}
        {hasPendingChanges}
        {jsonText}
        message={feedback}
        on:change={(event) => applyParams(event.detail)}
        on:export={exportSettings}
        on:import={importSettings}
        on:jsonChange={(event) => onJsonChange(event.detail)}
        on:createCustomNorm={createCustomNorm}
        on:duplicateSelectedNorm={duplicateSelectedNorm}
        on:editSelectedNorm={editSelectedNorm}
      />
      {#if editingCode}
        <CustomNormEditor
          code={editingCode}
          on:save={(event) => saveCustomNorm(event.detail)}
          on:delete={(event) => deleteCustomNorm(event.detail.code)}
          on:cancel={() => {
            editingCode = null
            editingOriginalCode = null
          }}
        />
      {/if}
    </div>

    <div class="right-col">
      <div class="right-top-grid">
        <MatrixView imageMatrix={simState.imageMatrix} assessmentMode={simState.params.assessmentMode} />
        <div class="right-side-stack">
          <TimeSeriesChart history={statsHistory} />
          <StatsPanel {stats} />
        </div>
      </div>
      <EventLog events={simState.events} />
    </div>
  </div>
</main>
