<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount } from 'svelte'

  export let title = ''

  const dispatch = createEventDispatcher<{
    close: void
  }>()

  let dialogElement: HTMLDivElement | null = null
  let previousOverflow = ''

  function close(): void {
    dispatch('close')
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      close()
    }
  }

  onMount(() => {
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogElement?.focus()
  })

  onDestroy(() => {
    document.body.style.overflow = previousOverflow
  })
</script>

<svelte:window on:keydown={onKeydown} />

<div class="backdrop" aria-hidden="true"></div>

<div
  bind:this={dialogElement}
  class="dialog"
  role="dialog"
  aria-modal="true"
  aria-label={title}
  tabindex="-1"
>
  <div class="dialog-header">
    <h2>{title}</h2>
    <button type="button" class="close-button" aria-label="Cancel editing" on:click={close}>Cancel</button>
  </div>
  <div class="dialog-body">
    <slot />
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.35);
    backdrop-filter: blur(2px);
    z-index: 1000;
  }

  .dialog {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: min(1080px, 94vw);
    max-height: min(760px, 90vh);
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    background: #ffffff;
    border: 1px solid #d9dee4;
    border-radius: 16px;
    box-shadow: 0 24px 80px rgba(15, 23, 42, 0.24);
    z-index: 1001;
    outline: none;
  }

  .dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem 1.2rem 0.9rem;
    border-bottom: 1px solid #e2e8f0;
  }

  h2 {
    margin: 0;
    font-size: 1.05rem;
  }

  .dialog-body {
    overflow: auto;
    padding: 1rem 1.2rem 1.2rem;
  }

  .close-button {
    min-width: 5.5rem;
    padding: 0.4rem 0.75rem;
  }

  @media (max-width: 720px) {
    .dialog {
      width: 96vw;
      max-height: 92vh;
    }

    .dialog-header,
    .dialog-body {
      padding-left: 0.85rem;
      padding-right: 0.85rem;
    }
  }
</style>
