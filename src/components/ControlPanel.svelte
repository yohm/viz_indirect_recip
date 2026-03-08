<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import type { ActionRuleDefinition } from '../lib/sim/actionRules'
  import type { NormDefinition } from '../lib/sim/norms'
  import type { InitialReputationMode, SimulationParameters } from '../lib/sim/types'

  export let params: SimulationParameters
  export let norms: NormDefinition[] = []
  export let actionRules: ActionRuleDefinition[] = []
  export let jsonText = ''
  export let message = ''

  const dispatch = createEventDispatcher<{
    change: SimulationParameters
    export: void
    import: void
    jsonChange: string
  }>()

  function update<K extends keyof SimulationParameters>(key: K, value: SimulationParameters[K]): void {
    dispatch('change', { ...params, [key]: value })
  }

  function updateMode(value: string): void {
    update('initialReputationMode', value as InitialReputationMode)
  }
</script>

<section class="panel">
  <h2>Parameters</h2>

  <label>
    Number of agents (N)
    <input
      type="number"
      min="2"
      max="500"
      step="1"
      value={params.numAgents}
      on:input={(event) => update('numAgents', Number((event.currentTarget as HTMLInputElement).value))}
    />
  </label>

  <label>
    Norm preset
    <select value={params.normId} on:change={(event) => update('normId', (event.currentTarget as HTMLSelectElement).value)}>
      {#each norms as norm}
        <option value={norm.id}>{norm.name}</option>
      {/each}
    </select>
  </label>

  <label>
    Action rule
    <select
      value={params.actionRuleId}
      on:change={(event) => update('actionRuleId', (event.currentTarget as HTMLSelectElement).value)}
    >
      {#each actionRules as rule}
        <option value={rule.id}>{rule.name}</option>
      {/each}
    </select>
  </label>

  <label>
    Observation probability
    <input
      type="number"
      min="0"
      max="1"
      step="0.01"
      value={params.observationProbability}
      on:input={(event) =>
        update('observationProbability', Number((event.currentTarget as HTMLInputElement).value))}
    />
  </label>

  <label>
    Action error probability
    <input
      type="number"
      min="0"
      max="1"
      step="0.01"
      value={params.actionErrorProbability}
      on:input={(event) =>
        update('actionErrorProbability', Number((event.currentTarget as HTMLInputElement).value))}
    />
  </label>

  <label>
    Assessment error probability
    <input
      type="number"
      min="0"
      max="1"
      step="0.01"
      value={params.assessmentErrorProbability}
      on:input={(event) =>
        update('assessmentErrorProbability', Number((event.currentTarget as HTMLInputElement).value))}
    />
  </label>

  <label>
    Initial reputation
    <select value={params.initialReputationMode} on:change={(event) => updateMode((event.currentTarget as HTMLSelectElement).value)}>
      <option value="all-good">All good</option>
      <option value="random">Random</option>
    </select>
  </label>

  <label>
    Random seed
    <input
      type="number"
      step="1"
      value={params.seed}
      on:input={(event) => update('seed', Number((event.currentTarget as HTMLInputElement).value))}
    />
  </label>

  <label>
    Autoplay speed (steps/sec)
    <input
      type="number"
      min="1"
      max="120"
      step="1"
      value={params.autoplayStepsPerSecond}
      on:input={(event) =>
        update('autoplayStepsPerSecond', Number((event.currentTarget as HTMLInputElement).value))}
    />
  </label>

  <div class="json-row">
    <button type="button" on:click={() => dispatch('export')}>Export JSON</button>
    <button type="button" on:click={() => dispatch('import')}>Import JSON</button>
  </div>

  <label>
    JSON settings
    <textarea
      rows="10"
      value={jsonText}
      on:input={(event) => dispatch('jsonChange', (event.currentTarget as HTMLTextAreaElement).value)}
    ></textarea>
  </label>

  {#if message}
    <p class="message">{message}</p>
  {/if}
</section>

<style>
  .panel {
    display: grid;
    gap: 0.6rem;
    background: #ffffff;
    border: 1px solid #d9dee4;
    border-radius: 10px;
    padding: 1rem;
  }

  h2 {
    margin: 0;
    font-size: 1rem;
  }

  label {
    display: grid;
    gap: 0.2rem;
    font-size: 0.9rem;
  }

  input,
  select,
  textarea {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid #cfd8e3;
    border-radius: 6px;
    padding: 0.5rem;
    font: inherit;
  }

  .json-row {
    display: flex;
    gap: 0.6rem;
  }

  .message {
    margin: 0;
    font-size: 0.85rem;
    color: #334155;
    white-space: pre-wrap;
  }
</style>
