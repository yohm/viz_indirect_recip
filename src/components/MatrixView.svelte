<script lang="ts">
  import { onMount } from 'svelte'
  import { drawImageMatrix, getMatrixCellAt } from '../lib/render/imageMatrixCanvas'
  import type { AssessmentMode, Reputation } from '../lib/sim/types'

  export let imageMatrix: Reputation[][] = []
  export let assessmentMode: AssessmentMode = 'private'

  let canvas: HTMLCanvasElement | null = null
  let hovered: { row: number; col: number } | null = null
  let selectedObserver: number | null = null
  let selectedTarget: number | null = null

  function redraw(): void {
    if (!canvas) return
    drawImageMatrix(canvas, imageMatrix, { selectedObserver, selectedTarget })
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
  <div class="canvas-wrap">
    <canvas bind:this={canvas} on:mousemove={onMouseMove} on:mouseleave={onMouseLeave} on:click={onClick}></canvas>
  </div>
  {#if hovered}
    <p class="meta">observer {hovered.row} -> target {hovered.col}: {imageMatrix[hovered.row][hovered.col]}</p>
  {/if}
  {#if selectedObserver !== null && selectedTarget !== null}
    <p class="meta">selected row {selectedObserver}, column {selectedTarget}</p>
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
