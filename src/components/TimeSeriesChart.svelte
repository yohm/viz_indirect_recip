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
  const focalColor = '#1d4ed8'
  const alldColor = '#b91c1c'
  const allcColor = '#15803d'

  function xForStep(step: number, minStep: number, maxStep: number): number {
    if (minStep === maxStep) {
      return margin.left + plotWidth / 2
    }

    return margin.left + ((step - minStep) / (maxStep - minStep)) * plotWidth
  }

  function yForValue(value: number, minValue: number, maxValue: number): number {
    if (minValue === maxValue) {
      return margin.top + plotHeight / 2
    }

    return margin.top + ((maxValue - value) / (maxValue - minValue)) * plotHeight
  }

  function buildLinePath(
    points: TimeSeriesPoint[],
    getValue: (point: TimeSeriesPoint) => number,
    minValue: number,
    maxValue: number,
  ): string {
    if (points.length === 0) return ''

    const minStep = points[0].step
    const maxStep = points[points.length - 1].step

    return points
      .map((point, index) => {
        const command = index === 0 ? 'M' : 'L'
        const x = xForStep(point.step, minStep, maxStep)
        const y = yForValue(getValue(point), minValue, maxValue)
        return `${command} ${x.toFixed(2)} ${y.toFixed(2)}`
      })
      .join(' ')
  }

  function describePoint(point: TimeSeriesPoint): string {
    return point.kind === 'monomorphic'
      ? 'Cooperation rate and good fraction over time, using a rolling average over the last 100 steps'
      : 'Average payoffs over time, using the same rolling average over the last 100 steps shown in Summary'
  }

  function collectValues(points: TimeSeriesPoint[]): number[] {
    return points.flatMap((point) =>
      point.kind === 'monomorphic'
        ? [point.cooperationRate, point.fractionGood]
        : [point.focalPayoff, point.alldPayoff, point.allcPayoff],
    )
  }

  $: hasHistory = history.length > 0
  $: minStep = hasHistory ? history[0].step : 0
  $: maxStep = hasHistory ? history[history.length - 1].step : 0
  $: chartKind = hasHistory ? history[0].kind : 'monomorphic'
  $: valueSeries = collectValues(history)
  $: rawMinValue = valueSeries.length > 0 ? Math.min(...valueSeries) : 0
  $: rawMaxValue = valueSeries.length > 0 ? Math.max(...valueSeries) : chartKind === 'monomorphic' ? 1 : 0
  $: paddedMinValue =
    chartKind === 'monomorphic'
      ? 0
      : rawMinValue === rawMaxValue
        ? rawMinValue - 1
        : rawMinValue - (rawMaxValue - rawMinValue) * 0.1
  $: paddedMaxValue =
    chartKind === 'monomorphic'
      ? 1
      : rawMinValue === rawMaxValue
        ? rawMaxValue + 1
        : rawMaxValue + (rawMaxValue - rawMinValue) * 0.1
  $: cooperationPath =
    chartKind === 'monomorphic' ? buildLinePath(history, (point) => point.kind === 'monomorphic' ? point.cooperationRate : 0, paddedMinValue, paddedMaxValue) : ''
  $: goodPath =
    chartKind === 'monomorphic' ? buildLinePath(history, (point) => point.kind === 'monomorphic' ? point.fractionGood : 0, paddedMinValue, paddedMaxValue) : ''
  $: focalPath =
    chartKind === 'polymorphic' ? buildLinePath(history, (point) => point.kind === 'polymorphic' ? point.focalPayoff : 0, paddedMinValue, paddedMaxValue) : ''
  $: alldPath =
    chartKind === 'polymorphic' ? buildLinePath(history, (point) => point.kind === 'polymorphic' ? point.alldPayoff : 0, paddedMinValue, paddedMaxValue) : ''
  $: allcPath =
    chartKind === 'polymorphic' ? buildLinePath(history, (point) => point.kind === 'polymorphic' ? point.allcPayoff : 0, paddedMinValue, paddedMaxValue) : ''
</script>

<section class="panel">
  <div class="header">
    <div class="title-block">
      <h2>Time Series</h2>
      <p class="note">
        {#if chartKind === 'monomorphic'}
          Each point shows the rolling average over the last 100 steps.
        {:else}
          Each point shows the same last-100-step window average used in Summary.
        {/if}
      </p>
    </div>
    <div class="legend" aria-label="Chart legend">
      {#if chartKind === 'monomorphic'}
        <span><i style={`background:${cooperationColor}`}></i>Cooperation</span>
        <span><i style={`background:${goodColor}`}></i>Good fraction</span>
      {:else}
        <span><i style={`background:${focalColor}`}></i>Focal payoff</span>
        <span><i style={`background:${alldColor}`}></i>ALLD payoff</span>
        <span><i style={`background:${allcColor}`}></i>ALLC payoff</span>
      {/if}
    </div>
  </div>

  {#if hasHistory}
    <svg viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} role="img" aria-label={describePoint(history[0])}>
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
      <line
        class="grid"
        x1={margin.left}
        y1={margin.top + plotHeight}
        x2={margin.left + plotWidth}
        y2={margin.top + plotHeight}
      />

      <text class="tick" x={margin.left - 10} y={margin.top + 4}>{paddedMaxValue.toFixed(chartKind === 'monomorphic' ? 1 : 2)}</text>
      <text class="tick" x={margin.left - 10} y={margin.top + plotHeight / 2 + 4}>{((paddedMinValue + paddedMaxValue) / 2).toFixed(chartKind === 'monomorphic' ? 1 : 2)}</text>
      <text class="tick" x={margin.left - 10} y={margin.top + plotHeight + 4}>{paddedMinValue.toFixed(chartKind === 'monomorphic' ? 1 : 2)}</text>
      <text class="tick" x={margin.left} y={viewBoxHeight - 8}>step {minStep}</text>
      <text class="tick tick-end" x={margin.left + plotWidth} y={viewBoxHeight - 8}>step {maxStep}</text>

      {#if history.length === 1}
        {#if history[0].kind === 'monomorphic'}
          <circle
            cx={xForStep(history[0].step, minStep, maxStep)}
            cy={yForValue(history[0].cooperationRate, paddedMinValue, paddedMaxValue)}
            r="4"
            fill={cooperationColor}
          />
          <circle
            cx={xForStep(history[0].step, minStep, maxStep)}
            cy={yForValue(history[0].fractionGood, paddedMinValue, paddedMaxValue)}
            r="4"
            fill={goodColor}
          />
        {:else}
          <circle
            cx={xForStep(history[0].step, minStep, maxStep)}
            cy={yForValue(history[0].focalPayoff, paddedMinValue, paddedMaxValue)}
            r="4"
            fill={focalColor}
          />
          <circle
            cx={xForStep(history[0].step, minStep, maxStep)}
            cy={yForValue(history[0].alldPayoff, paddedMinValue, paddedMaxValue)}
            r="4"
            fill={alldColor}
          />
          <circle
            cx={xForStep(history[0].step, minStep, maxStep)}
            cy={yForValue(history[0].allcPayoff, paddedMinValue, paddedMaxValue)}
            r="4"
            fill={allcColor}
          />
        {/if}
      {:else}
        {#if chartKind === 'monomorphic'}
          <path d={cooperationPath} fill="none" stroke={cooperationColor} stroke-width="3" stroke-linecap="round" />
          <path d={goodPath} fill="none" stroke={goodColor} stroke-width="3" stroke-linecap="round" />
        {:else}
          <path d={focalPath} fill="none" stroke={focalColor} stroke-width="3" stroke-linecap="round" />
          <path d={alldPath} fill="none" stroke={alldColor} stroke-width="3" stroke-linecap="round" />
          <path d={allcPath} fill="none" stroke={allcColor} stroke-width="3" stroke-linecap="round" />
        {/if}
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

  .title-block {
    display: grid;
    gap: 0.2rem;
  }

  h2 {
    margin: 0;
    font-size: 1rem;
  }

  .note {
    margin: 0;
    font-size: 0.8rem;
    color: #64748b;
    line-height: 1.4;
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
