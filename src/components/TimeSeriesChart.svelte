<script lang="ts">
  import type { TimeSeriesPoint } from '../lib/sim/types'

  export let history: TimeSeriesPoint[] = []

  const viewBoxWidth = 640
  const viewBoxHeight = 260
  const margin = {
    top: 20,
    right: 16,
    bottom: 34,
    left: 42,
  }

  const plotWidth = viewBoxWidth - margin.left - margin.right
  const plotHeight = viewBoxHeight - margin.top - margin.bottom

  const cooperationColor = '#0f766e'
  const goodColor = '#c2410c'

  function xForStep(step: number, minStep: number, maxStep: number): number {
    if (minStep === maxStep) {
      return margin.left + plotWidth / 2
    }

    return margin.left + ((step - minStep) / (maxStep - minStep)) * plotWidth
  }

  function yForValue(value: number): number {
    return margin.top + (1 - value) * plotHeight
  }

  function buildLinePath(points: TimeSeriesPoint[], getValue: (point: TimeSeriesPoint) => number): string {
    if (points.length === 0) return ''

    const minStep = points[0].step
    const maxStep = points[points.length - 1].step

    return points
      .map((point, index) => {
        const command = index === 0 ? 'M' : 'L'
        const x = xForStep(point.step, minStep, maxStep)
        const y = yForValue(getValue(point))
        return `${command} ${x.toFixed(2)} ${y.toFixed(2)}`
      })
      .join(' ')
  }

  $: hasHistory = history.length > 0
  $: minStep = hasHistory ? history[0].step : 0
  $: maxStep = hasHistory ? history[history.length - 1].step : 0
  $: cooperationPath = buildLinePath(history, (point) => point.cooperationRate)
  $: goodPath = buildLinePath(history, (point) => point.fractionGood)
</script>

<section class="panel">
  <div class="header">
    <h2>Time Series</h2>
    <div class="legend" aria-label="Chart legend">
      <span><i style={`background:${cooperationColor}`}></i>Cooperation</span>
      <span><i style={`background:${goodColor}`}></i>Good fraction</span>
    </div>
  </div>

  {#if hasHistory}
    <svg viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} role="img" aria-label="Cooperation rate and good fraction over time">
      <line class="axis" x1={margin.left} y1={margin.top} x2={margin.left} y2={margin.top + plotHeight} />
      <line
        class="axis"
        x1={margin.left}
        y1={margin.top + plotHeight}
        x2={margin.left + plotWidth}
        y2={margin.top + plotHeight}
      />

      <line class="grid" x1={margin.left} y1={margin.top} x2={margin.left + plotWidth} y2={margin.top} />
      <line
        class="grid"
        x1={margin.left}
        y1={margin.top + plotHeight / 2}
        x2={margin.left + plotWidth}
        y2={margin.top + plotHeight / 2}
      />

      <text class="tick" x={margin.left - 10} y={margin.top + 4}>1.0</text>
      <text class="tick" x={margin.left - 10} y={margin.top + plotHeight / 2 + 4}>0.5</text>
      <text class="tick" x={margin.left - 10} y={margin.top + plotHeight + 4}>0.0</text>
      <text class="tick" x={margin.left} y={viewBoxHeight - 8}>step {minStep}</text>
      <text class="tick tick-end" x={margin.left + plotWidth} y={viewBoxHeight - 8}>step {maxStep}</text>

      {#if history.length === 1}
        <circle
          cx={xForStep(history[0].step, minStep, maxStep)}
          cy={yForValue(history[0].cooperationRate)}
          r="4"
          fill={cooperationColor}
        />
        <circle
          cx={xForStep(history[0].step, minStep, maxStep)}
          cy={yForValue(history[0].fractionGood)}
          r="4"
          fill={goodColor}
        />
      {:else}
        <path d={cooperationPath} fill="none" stroke={cooperationColor} stroke-width="3" stroke-linecap="round" />
        <path d={goodPath} fill="none" stroke={goodColor} stroke-width="3" stroke-linecap="round" />
      {/if}
    </svg>
  {:else}
    <p class="empty">Run the simulation to populate the chart.</p>
  {/if}
</section>

<style>
  .panel {
    background: #ffffff;
    border: 1px solid #d9dee4;
    border-radius: 10px;
    padding: 1rem;
  }

  .header {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    align-items: start;
    margin-bottom: 0.75rem;
  }

  h2 {
    margin: 0;
    font-size: 1rem;
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 0.8rem;
    justify-content: flex-end;
    font-size: 0.85rem;
    color: #4b5563;
  }

  .legend span {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    white-space: nowrap;
  }

  i {
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 999px;
    display: inline-block;
  }

  svg {
    width: 100%;
    height: auto;
    display: block;
  }

  .axis {
    stroke: #8da2b8;
    stroke-width: 1.5;
  }

  .grid {
    stroke: #d9e3ec;
    stroke-width: 1;
    stroke-dasharray: 4 4;
  }

  .tick {
    fill: #52667a;
    font-size: 0.8rem;
  }

  .tick-end {
    text-anchor: end;
  }

  .empty {
    margin: 0;
    min-height: 12rem;
    display: grid;
    place-items: center;
    color: #52667a;
    text-align: center;
    background: linear-gradient(180deg, #f8fbfd 0%, #f2f7fb 100%);
    border-radius: 8px;
    border: 1px dashed #d6e0e8;
  }

  @media (max-width: 720px) {
    .header {
      flex-direction: column;
    }

    .legend {
      justify-content: flex-start;
    }
  }
</style>
