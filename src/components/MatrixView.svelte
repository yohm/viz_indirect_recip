<script lang="ts">
  import { onMount } from 'svelte'
  import { drawImageMatrix, getMatrixCellAt } from '../lib/render/imageMatrixCanvas'
  import type { AgentStrategy, AssessmentMode, PopulationMode, Reputation } from '../lib/sim/types'

  export let imageMatrix: Reputation[][] = []
  export let assessmentMode: AssessmentMode = 'private'
  export let populationMode: PopulationMode = 'monomorphic'
  export let agentStrategies: AgentStrategy[] = []

  let canvas: HTMLCanvasElement | null = null
  let hovered: { row: number; col: number } | null = null
  let selectedObserver: number | null = null
  let selectedTarget: number | null = null

  const POLYMORPHIC_GROUPS = ['Focal', 'ALLD', 'ALLC'] as const

  function getSubgroupBoundaries(size: number): number[] {
    if (populationMode !== 'polymorphic' || size === 0) {
      return []
    }
    const blockSize = size / 3
    return [blockSize, blockSize * 2]
  }

  function strategyLabelFor(agent: number | null): string | null {
    if (agent === null) return null
    const strategy = agentStrategies[agent]
    if (!strategy) return null
    if (strategy === 'focal') return 'Focal'
    if (strategy === 'alld') return 'ALLD'
    return 'ALLC'
  }

  function redraw(): void {
    if (!canvas) return
    drawImageMatrix(canvas, imageMatrix, {
      subgroupBoundaries: getSubgroupBoundaries(imageMatrix.length),
      selectedObserver,
      selectedTarget,
    })
  }

  function onMouseMove(event: MouseEvent): void {
    if (!canvas) return
    hovered = getMatrixCellAt(canvas, imageMatrix, event.clientX, event.clientY)
  }

  function onMouseLeave(): void {
    hovered = null
  }

  function onClick(event: MouseEvent): void {
    if (!canvas) return
    const hit = getMatrixCellAt(canvas, imageMatrix, event.clientX, event.clientY)
    if (!hit) return
    selectedObserver = hit.row
    selectedTarget = hit.col
    redraw()
  }

  $: if (canvas) {
    // Make dependencies explicit so Svelte redraws on simulation updates.
    imageMatrix
    selectedObserver
    selectedTarget
    redraw()
  }

  onMount(() => {
    if (!canvas) return

    const observer = new ResizeObserver(() => redraw())
    observer.observe(canvas)

    return () => observer.disconnect()
  })
</script>

<section class="panel matrix-panel">
  <h2>Image Matrix</h2>
  <div class="legend">
    <span><i class="good"></i> Good</span>
    <span><i class="bad"></i> Bad</span>
  </div>
  {#if assessmentMode === 'public'}
    <p class="note">In public assessment mode, donor columns synchronize when agent 0 observes and updates.</p>
  {/if}
  {#if populationMode === 'polymorphic'}
    <p class="note">Thick dividers split focal, ALLD, and ALLC observer/target groups.</p>
  {/if}
  <div class="matrix-layout" class:with-groups={populationMode === 'polymorphic'}>
    {#if populationMode === 'polymorphic'}
      <div class="corner-label"></div>
      <div class="top-groups" aria-hidden="true">
        {#each POLYMORPHIC_GROUPS as group}
          <span>{group}</span>
        {/each}
      </div>
      <div class="side-groups" aria-hidden="true">
        {#each POLYMORPHIC_GROUPS as group}
          <span>{group}</span>
        {/each}
      </div>
    {/if}
    <div class="canvas-wrap">
      <canvas bind:this={canvas} on:mousemove={onMouseMove} on:mouseleave={onMouseLeave} on:click={onClick}></canvas>
    </div>
  </div>
  {#if hovered}
    <p class="meta">
      observer {hovered.row}{#if strategyLabelFor(hovered.row)} ({strategyLabelFor(hovered.row)}){/if}
      -> target {hovered.col}{#if strategyLabelFor(hovered.col)} ({strategyLabelFor(hovered.col)}){/if}:
      {imageMatrix[hovered.row][hovered.col]}
    </p>
  {/if}
  {#if selectedObserver !== null && selectedTarget !== null}
    <p class="meta">
      selected row {selectedObserver}{#if strategyLabelFor(selectedObserver)} ({strategyLabelFor(selectedObserver)}){/if},
      column {selectedTarget}{#if strategyLabelFor(selectedTarget)} ({strategyLabelFor(selectedTarget)}){/if}
    </p>
  {/if}
</section>

<style>
  .panel {
    background: #ffffff;
    border: 1px solid #d9dee4;
    border-radius: 10px;
    padding: 1rem;
  }

  .matrix-panel {
    justify-self: start;
    width: min(100%, 522px);
  }

  h2 {
    margin: 0 0 0.4rem;
    font-size: 1rem;
  }

  .legend {
    display: flex;
    gap: 1rem;
    margin-bottom: 0.6rem;
    font-size: 0.85rem;
  }

  .note {
    margin: 0 0 0.6rem;
    font-size: 0.85rem;
    color: #475569;
  }

  i {
    display: inline-block;
    width: 0.8rem;
    height: 0.8rem;
    border-radius: 2px;
    margin-right: 0.2rem;
    vertical-align: middle;
  }

  .good {
    background: #2e8b57;
  }

  .bad {
    background: #c0392b;
  }

  .canvas-wrap {
    width: 100%;
    aspect-ratio: 1 / 1;
    border: 1px solid #cfd8e3;
    border-radius: 6px;
    overflow: hidden;
  }

  .matrix-layout {
    display: grid;
    gap: 0.35rem;
  }

  .matrix-layout.with-groups {
    grid-template-columns: 3.6rem minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr);
    align-items: stretch;
  }

  .corner-label {
    grid-column: 1;
    grid-row: 1;
  }

  .top-groups {
    grid-column: 2;
    grid-row: 1;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0;
    font-size: 0.78rem;
    color: #334155;
    text-align: center;
    font-weight: 600;
  }

  .side-groups {
    grid-column: 1;
    grid-row: 2;
    display: grid;
    grid-template-rows: repeat(3, 1fr);
    gap: 0;
    font-size: 0.78rem;
    color: #334155;
    font-weight: 600;
    align-items: center;
    justify-items: end;
    padding-right: 0.35rem;
  }

  .matrix-layout.with-groups .canvas-wrap {
    grid-column: 2;
    grid-row: 2;
  }

  canvas {
    width: 100%;
    height: 100%;
    display: block;
  }

  .meta {
    font-size: 0.85rem;
    margin: 0.4rem 0 0;
  }
</style>
