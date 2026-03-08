<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  export let running = false

  const dispatch = createEventDispatcher<{
    reset: void
    step: void
    toggleRun: void
  }>()
</script>

<section class="controls">
  <button type="button" on:click={() => dispatch('reset')}>Initialize / Reset</button>
  <button type="button" on:click={() => dispatch('step')}>Step</button>
  <button type="button" on:click={() => dispatch('toggleRun')}>{running ? 'Pause' : 'Run'}</button>
</section>

<style>
  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    align-items: center;
  }
</style>
