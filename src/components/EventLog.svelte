<script lang="ts">
  import type { InteractionEvent } from '../lib/sim/types'

  export let events: InteractionEvent[] = []

  function describeChanges(event: InteractionEvent): string {
    if (event.reputationChanges.length === 0) {
      return 'none'
    }

    return event.reputationChanges.map((change) => `obs ${change.observer}: ${change.previous}->${change.next}`).join(', ')
  }
</script>

<section class="panel">
  <h2>Recent Events</h2>
  <div class="log">
    {#if events.length === 0}
      <p class="empty">No events yet.</p>
    {:else}
      {#each [...events].reverse() as event (event.step)}
        <article>
          <header>step {event.step}: donor {event.donor} -> recipient {event.recipient}</header>
          <p>intended {event.intendedAction} / realized {event.realizedAction}</p>
          {#if event.assessor === null}
            <p>observers: {event.observingAgents.join(', ') || 'none'}</p>
            <p>changed reputations: {describeChanges(event)}</p>
          {:else}
            <p>public observer: agent {event.assessor} {event.observingAgents.length === 0 ? '(did not observe)' : '(observed)'}</p>
            <p>
              public update:
              {event.observingAgents.length === 0
                ? 'donor reputation unchanged'
                : `agent ${event.assessor}'s assessment was copied to all agents`}
            </p>
            <p>changed reputations: {describeChanges(event)}</p>
          {/if}
        </article>
      {/each}
    {/if}
  </div>
</section>

<style>
  .panel {
    background: #ffffff;
    border: 1px solid #d9dee4;
    border-radius: 10px;
    padding: 1rem;
  }

  h2 {
    margin: 0 0 0.6rem;
    font-size: 1rem;
  }

  .log {
    max-height: 420px;
    overflow: auto;
    display: grid;
    gap: 0.5rem;
  }

  article {
    border: 1px solid #e5eaf1;
    border-radius: 8px;
    padding: 0.5rem;
    font-size: 0.85rem;
    background: #f8fafc;
  }

  header {
    font-weight: 600;
    margin-bottom: 0.2rem;
  }

  p {
    margin: 0.15rem 0;
  }

  .empty {
    margin: 0;
    color: #6b7280;
  }
</style>
