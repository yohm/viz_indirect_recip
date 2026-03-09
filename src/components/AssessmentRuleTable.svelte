<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import type { AssessmentTable, AssessmentTableKey, Reputation } from '../lib/sim/types'

  export let table: AssessmentTable

  const dispatch = createEventDispatcher<{
    change: AssessmentTable
  }>()

  const donorViews: Reputation[] = ['G', 'B']
  const recipientViews: Reputation[] = ['G', 'B']
  const reputations: Reputation[] = ['G', 'B']

  function makeKey(donorView: Reputation, recipientView: Reputation, action: 'C' | 'D'): AssessmentTableKey {
    return `${donorView}-${recipientView}-${action}`
  }

  function update(key: AssessmentTableKey, value: Reputation): void {
    dispatch('change', { ...table, [key]: value })
  }
</script>

<div class="rule-table-wrap">
  <table class="rule-table">
    <thead>
      <tr>
        <th>Recipient \ Donor</th>
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
                <div class="choice-row">
                  <span>Action C</span>
                  <div class="button-group" role="group" aria-label={`Recipient ${recipientView}, donor ${donorView}, action C`}>
                    {#each reputations as reputation}
                      <button
                        type="button"
                        class:active={table[makeKey(donorView, recipientView, 'C')] === reputation}
                        on:click={() => update(makeKey(donorView, recipientView, 'C'), reputation)}
                      >
                        {reputation}
                      </button>
                    {/each}
                  </div>
                </div>
                <div class="choice-row">
                  <span>Action D</span>
                  <div class="button-group" role="group" aria-label={`Recipient ${recipientView}, donor ${donorView}, action D`}>
                    {#each reputations as reputation}
                      <button
                        type="button"
                        class:active={table[makeKey(donorView, recipientView, 'D')] === reputation}
                        on:click={() => update(makeKey(donorView, recipientView, 'D'), reputation)}
                      >
                        {reputation}
                      </button>
                    {/each}
                  </div>
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
  :global(:root) {
    --rule-card-min-height: 7.2rem;
  }

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
    padding: 0.15rem 0.25rem;
  }

  th:first-child {
    width: 7.2rem;
  }

  .cell {
    display: grid;
    gap: 0.4rem;
    min-height: 100%;
    height: 100%;
    min-height: var(--rule-card-min-height);
    border: 1px solid #d9dee4;
    border-radius: 12px;
    background: #fbfdff;
    padding: 0.5rem 0.5rem;
  }

  .choice-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.3rem;
  }

  .choice-row span {
    font-size: 0.69rem;
    font-weight: 600;
    color: #475569;
  }

  .button-group {
    display: inline-flex;
    align-items: center;
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
      min-width: 520px;
    }
  }
</style>
