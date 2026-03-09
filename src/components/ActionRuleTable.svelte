<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import type { Action, ActionTable, ActionTableKey, Reputation } from '../lib/sim/types'

  export let table: ActionTable

  const dispatch = createEventDispatcher<{
    change: ActionTable
  }>()

  const actions: Action[] = ['C', 'D']
  const donorViews: Reputation[] = ['G', 'B']
  const recipientViews: Reputation[] = ['G', 'B']

  function makeKey(donorView: Reputation, recipientView: Reputation): ActionTableKey {
    return `${donorView}-${recipientView}`
  }

  function update(key: ActionTableKey, value: Action): void {
    dispatch('change', { ...table, [key]: value })
  }
</script>

<div class="rule-table-wrap">
  <table class="rule-table">
    <thead>
      <tr>
        <th>Recipient \ Self</th>
        {#each donorViews as donorView}
          <th>{donorView}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each recipientViews as recipientView}
        <tr>
          <th>{recipientView}</th>
          {#each donorViews as donorView}
            <td>
              <div class="cell">
                <div class="button-group" role="group" aria-label={`Recipient ${recipientView}, self ${donorView}`}>
                  {#each actions as action}
                    <button
                      type="button"
                      class:active={table[makeKey(donorView, recipientView)] === action}
                      on:click={() => update(makeKey(donorView, recipientView), action)}
                    >
                      {action}
                    </button>
                  {/each}
                </div>
              </div>
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .rule-table-wrap {
    overflow-x: auto;
  }

  .rule-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0.28rem;
    table-layout: fixed;
  }

  thead tr {
    height: 2.4rem;
  }

  tbody tr {
    height: 5.15rem;
  }

  th {
    font-size: 0.74rem;
    font-weight: 700;
    color: #475569;
    text-align: center;
    padding: 0.15rem 0.2rem;
  }

  th:first-child {
    width: 7.2rem;
  }

  .cell {
    display: grid;
    justify-items: center;
    align-content: center;
    gap: 0.4rem;
    min-height: 100%;
    border: 1px solid #d9dee4;
    border-radius: 12px;
    background: #fbfdff;
    padding: 0.5rem;
    height: 100%;
    min-height: var(--rule-card-min-height);
  }

  .button-group {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
  }

  .button-group button {
    min-width: 1.8rem;
    border: 1px solid #cbd5e1;
    border-radius: 999px;
    background: #ffffff;
    padding: 0.16rem 0.38rem;
    font: inherit;
    font-size: 0.74rem;
    line-height: 1.2;
  }

  .button-group button.active {
    border-color: #102a43;
    background: #102a43;
    color: #ffffff;
  }

  @media (max-width: 720px) {
    .rule-table {
      min-width: 420px;
    }
  }
</style>
