<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import type { AssessmentTable, AssessmentTableKey, Reputation } from '../lib/sim/types'

  export let table: AssessmentTable

  const dispatch = createEventDispatcher<{
    change: AssessmentTable
  }>()

  const donorViews: Reputation[] = ['G', 'B']
  const recipientViews: Reputation[] = ['G', 'B']

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
                <label>
                  <span>Action C</span>
                  <select
                    value={table[makeKey(donorView, recipientView, 'C')]}
                    on:change={(event) =>
                      update(
                        makeKey(donorView, recipientView, 'C'),
                        (event.currentTarget as HTMLSelectElement).value as Reputation,
                      )}
                  >
                    <option value="G">G</option>
                    <option value="B">B</option>
                  </select>
                </label>
                <label>
                  <span>Action D</span>
                  <select
                    value={table[makeKey(donorView, recipientView, 'D')]}
                    on:change={(event) =>
                      update(
                        makeKey(donorView, recipientView, 'D'),
                        (event.currentTarget as HTMLSelectElement).value as Reputation,
                      )}
                  >
                    <option value="G">G</option>
                    <option value="B">B</option>
                  </select>
                </label>
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
    border-spacing: 0.5rem;
    table-layout: fixed;
  }

  th {
    font-size: 0.8rem;
    font-weight: 700;
    color: #475569;
    text-align: center;
    padding: 0.25rem 0.35rem;
  }

  .cell {
    display: grid;
    gap: 0.6rem;
    border: 1px solid #d9dee4;
    border-radius: 10px;
    background: #fbfdff;
    padding: 0.65rem;
  }

  label {
    display: grid;
    gap: 0.25rem;
    font-size: 0.78rem;
    color: #475569;
  }

  select {
    width: 100%;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background: #ffffff;
    padding: 0.4rem 0.5rem;
    font: inherit;
  }
</style>
