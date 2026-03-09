<script lang="ts">
  import { onDestroy } from 'svelte'
  import ControlPanel from './components/ControlPanel.svelte'
  import EventLog from './components/EventLog.svelte'
  import MatrixView from './components/MatrixView.svelte'
  import SimulationControls from './components/SimulationControls.svelte'
  import StatsPanel from './components/StatsPanel.svelte'
  import TimeSeriesChart from './components/TimeSeriesChart.svelte'
  import { initializeSimulation } from './lib/sim/initialize'
  import { SOCIAL_NORM_PRESETS } from './lib/sim/socialNormPresets'
  import { DEFAULT_PARAMETERS, validateParameters } from './lib/sim/state'
  import { appendTimeSeriesPoint, computeStats, toTimeSeriesPoint } from './lib/sim/stats'
  import { stepSimulation } from './lib/sim/step'
  import type { SimulationParameters, SimulationState, TimeSeriesPoint } from './lib/sim/types'
  import { parseJson, toPrettyJson } from './lib/utils/json'

  const MAX_CHART_POINTS = 500

  let editableParams: SimulationParameters = { ...DEFAULT_PARAMETERS }
  let simState: SimulationState = initializeSimulation(validateParameters({ ...editableParams }))
  let stats = computeStats(simState)
  let statsHistory: TimeSeriesPoint[] = [toTimeSeriesPoint(stats)]
  let running = false
  let loopHandle: ReturnType<typeof setInterval> | null = null

  let feedback = ''
  let jsonText = ''

  function applyParams(updated: SimulationParameters): void {
    editableParams = updated
  }

  function resetSimulation(): void {
    try {
      const validated = validateParameters({ ...editableParams })
      editableParams = validated
      simState = initializeSimulation(validated)
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
      const { nextState } = stepSimulation(simState)
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
    jsonText = toPrettyJson(editableParams)

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
      const parsed = parseJson<Partial<SimulationParameters>>(jsonText)
      const merged = validateParameters({
        ...DEFAULT_PARAMETERS,
        ...editableParams,
        ...parsed,
      })
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

  onDestroy(() => {
    stopLoop()
  })
</script>

<main>
  <h1>Indirect Reciprocity Simulator</h1>

  <div class="layout">
    <div class="left-col">
      <ControlPanel
        params={editableParams}
        socialNormPresets={SOCIAL_NORM_PRESETS}
        {jsonText}
        message={feedback}
        on:change={(event) => applyParams(event.detail)}
        on:export={exportSettings}
        on:import={importSettings}
        on:jsonChange={(event) => onJsonChange(event.detail)}
      />

      <SimulationControls
        {running}
        on:reset={resetSimulation}
        on:step={stepOnce}
        on:toggleRun={toggleRun}
      />
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
