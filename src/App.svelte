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
  import {
    duplicatePresetAsCustom,
    listAvailableSocialNorms,
    resolveSocialNorm,
    validateCustomSocialNormCollection,
  } from './lib/sim/socialNormCatalog'
  import { DEFAULT_PARAMETERS, validateParameters } from './lib/sim/state'
  import { appendTimeSeriesPoint, computeStats, toTimeSeriesPoint } from './lib/sim/stats'
  import { stepSimulation } from './lib/sim/step'
  import type { CustomSocialNormDefinition, SimulationParameters, SimulationState, TimeSeriesPoint } from './lib/sim/types'
  import { normalizeSettingsDocument, parseJson, toPrettyJson, type SimulationSettingsDocument } from './lib/utils/json'

  const MAX_CHART_POINTS = 500

  let editableParams: SimulationParameters = { ...DEFAULT_PARAMETERS }
  let customSocialNorms: CustomSocialNormDefinition[] = []
  let appliedCustomSocialNorms: CustomSocialNormDefinition[] = []
  let simState: SimulationState = initializeSimulation(validateParameters({ ...editableParams }, customSocialNorms))
  let stats = computeStats(simState)
  let statsHistory: TimeSeriesPoint[] = [toTimeSeriesPoint(stats)]
  let running = false
  let loopHandle: ReturnType<typeof setInterval> | null = null

  let feedback = ''
  let jsonText = ''
  let hasPendingChanges = false
  let editingNormId: string | null = null

  function cloneCustomNorms(norms: CustomSocialNormDefinition[]): CustomSocialNormDefinition[] {
    return norms.map((norm) => ({
      ...norm,
      assessmentRule: {
        ...norm.assessmentRule,
        table: { ...norm.assessmentRule.table },
      },
      actionRule: {
        ...norm.actionRule,
        table: { ...norm.actionRule.table },
      },
    }))
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

  function areCustomNormCollectionsEqual(a: CustomSocialNormDefinition[], b: CustomSocialNormDefinition[]): boolean {
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

  function makeCustomId(base: string): string {
    const slug = base
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'custom-norm'
    let candidate = slug
    let suffix = 2
    const existingIds = new Set(customSocialNorms.map((item) => item.id))
    while (existingIds.has(candidate)) {
      candidate = `${slug}-${suffix}`
      suffix += 1
    }
    return candidate
  }

  function createBlankCustomNorm(): CustomSocialNormDefinition {
    const id = makeCustomId('custom-norm')
    return {
      id,
      name: 'Custom norm',
      description: 'Editable user-defined social norm.',
      assessmentRule: {
        id: `${id}-assessment`,
        name: 'Custom norm Assessment',
        description: 'Editable assessment rule.',
        table: {
          'G-G-C': 'G',
          'G-G-D': 'B',
          'G-B-C': 'G',
          'G-B-D': 'B',
          'B-G-C': 'G',
          'B-G-D': 'B',
          'B-B-C': 'G',
          'B-B-D': 'B',
        },
      },
      actionRule: {
        id: `${id}-action`,
        name: 'Custom norm Action',
        description: 'Editable action rule.',
        table: {
          'G-G': 'C',
          'G-B': 'D',
          'B-G': 'C',
          'B-B': 'D',
        },
      },
    }
  }

  function createCustomNorm(): void {
    const created = createBlankCustomNorm()
    customSocialNorms = [...customSocialNorms, created]
    editableParams = { ...editableParams, socialNormId: created.id }
    editingNormId = created.id
  }

  function duplicateSelectedNorm(): void {
    const selected = resolveSocialNorm(editableParams.socialNormId, customSocialNorms)
    const customId = makeCustomId(`${selected.id}-copy`)
    const customName = `${selected.name} Copy`
    const duplicated = selected.source === 'custom'
      ? (() => {
          const source = cloneCustomNorms(customSocialNorms).find((item) => item.id === selected.id)
          if (!source) {
            throw new Error(`Unknown social norm id: ${selected.id}`)
          }
          return {
            ...source,
            id: customId,
            name: customName,
            description: `Custom copy of ${selected.name}.`,
            assessmentRule: {
              ...source.assessmentRule,
              id: `${customId}-assessment`,
              name: `${customName} Assessment`,
            },
            actionRule: {
              ...source.actionRule,
              id: `${customId}-action`,
              name: `${customName} Action`,
            },
          }
        })()
      : duplicatePresetAsCustom(selected.id, customId, customName)

    customSocialNorms = [...customSocialNorms, duplicated]
    editableParams = { ...editableParams, socialNormId: duplicated.id }
    editingNormId = duplicated.id
  }

  function saveCustomNorm(updated: CustomSocialNormDefinition): void {
    customSocialNorms = customSocialNorms.map((item) => (item.id === editingNormId ? updated : item))
    editableParams = {
      ...editableParams,
      socialNormId: editableParams.socialNormId === editingNormId ? updated.id : editableParams.socialNormId,
    }
    editingNormId = updated.id
  }

  function deleteCustomNorm(id: string): void {
    customSocialNorms = customSocialNorms.filter((item) => item.id !== id)
    if (editableParams.socialNormId === id) {
      editableParams = { ...editableParams, socialNormId: DEFAULT_PARAMETERS.socialNormId }
    }
    editingNormId = null
  }

  function editSelectedNorm(): void {
    editingNormId = editableParams.socialNormId
  }

  $: socialNormOptions = listAvailableSocialNorms(customSocialNorms)
  $: selectedNorm = resolveSocialNorm(editableParams.socialNormId, customSocialNorms)
  $: editingNorm = editingNormId ? customSocialNorms.find((item) => item.id === editingNormId) ?? null : null
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
        selectedNormDescription={selectedNorm.description}
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
      {#if editingNorm}
        <CustomNormEditor
          norm={editingNorm}
          on:save={(event) => saveCustomNorm(event.detail)}
          on:delete={(event) => deleteCustomNorm(event.detail.id)}
          on:cancel={() => (editingNormId = null)}
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
