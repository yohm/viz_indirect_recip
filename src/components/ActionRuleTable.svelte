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
              <label class="cell">
                <span>Action</span>
                <select
                  value={table[makeKey(donorView, recipientView)]}
                  on:change={(event) =>
                    update(makeKey(donorView, recipientView), (event.currentTarget as HTMLSelectElement).value as Action)}
                >
                  {#each actions as action}
                    <option value={action}>{action}</option>
                  {/each}
                </select>
              </label>
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
    gap: 0.35rem;
    border: 1px solid #d9dee4;
    border-radius: 10px;
    background: #fbfdff;
    padding: 0.65rem;
  }

  label {
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
