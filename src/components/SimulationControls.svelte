<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  export let running = false
  export let hasPendingChanges = false

  const dispatch = createEventDispatcher<{
    reset: void
    step: void
    toggleRun: void
  }>()
</script>

<section class="controls">
  <button
    type="button"
    class:pending-action={hasPendingChanges}
    class="control-button"
    on:click={() => dispatch('reset')}
  >
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20 11a8 8 0 1 1-2.34-5.66M20 4v5h-5"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
    <span>{hasPendingChanges ? 'Apply Changes' : 'Initialize / Reset'}</span>
    {#if hasPendingChanges}
      <span class="pending-dot" aria-hidden="true"></span>
    {/if}
  </button>
  <button type="button" class="control-button" on:click={() => dispatch('step')}>
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 6l8 6-8 6z" fill="currentColor" />
      <path d="M18 6v12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    </svg>
    <span>Step</span>
  </button>
  <button type="button" class="control-button primary" on:click={() => dispatch('toggleRun')}>
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {#if running}
        <path d="M7 6h4v12H7zM13 6h4v12h-4z" fill="currentColor" />
      {:else}
        <path d="M8 6l10 6-10 6z" fill="currentColor" />
      {/if}
    </svg>
    <span>{running ? 'Pause' : 'Run'}</span>
  </button>
</section>

<style>
  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    align-items: center;
  }

  .control-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding-inline: 0.9rem;
  }

  svg {
    width: 1rem;
    height: 1rem;
    flex: none;
  }

  .pending-action {
    position: relative;
    border-color: #d97706;
    background: #fff7ed;
    color: #9a3412;
    box-shadow: 0 0 0 1px rgba(217, 119, 6, 0.18);
  }

  .pending-action:hover {
    background: #ffedd5;
  }

  .pending-dot {
    width: 0.55rem;
    height: 0.55rem;
    border-radius: 999px;
    background: #d97706;
    box-shadow: 0 0 0 0 rgba(217, 119, 6, 0.45);
    animation: pulse 1.6s ease-out infinite;
  }

  .primary {
    background: #0f766e;
    border-color: #0f766e;
    color: #ffffff;
  }

  .primary:hover {
    background: #0b5f59;
  }

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(217, 119, 6, 0.4);
    }

    70% {
      box-shadow: 0 0 0 0.45rem rgba(217, 119, 6, 0);
    }

    100% {
      box-shadow: 0 0 0 0 rgba(217, 119, 6, 0);
    }
  }
</style>
