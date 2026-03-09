<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import type { SocialNormListItem } from '../lib/sim/socialNormCatalog'
  import type { AssessmentMode, InitialReputationMode, SimulationParameters } from '../lib/sim/types'

  export let params: SimulationParameters
  export let socialNormOptions: SocialNormListItem[] = []
  export let selectedNormSource: 'preset' | 'custom' = 'preset'
  export let hasPendingChanges = false
  export let jsonText = ''
  export let message = ''

  const dispatch = createEventDispatcher<{
    change: SimulationParameters
    export: void
    import: void
    jsonChange: string
    createCustomNorm: void
    duplicateSelectedNorm: void
    editSelectedNorm: void
  }>()

  function update<K extends keyof SimulationParameters>(key: K, value: SimulationParameters[K]): void {
    dispatch('change', { ...params, [key]: value })
  }

  function updateMode(value: string): void {
    update('initialReputationMode', value as InitialReputationMode)
  }

  function updateAssessmentMode(value: string): void {
    update('assessmentMode', value as AssessmentMode)
  }
</script>

<section class:pending={hasPendingChanges} class="panel">
  <div class="title-row">
    <h2>Parameters</h2>
    {#if hasPendingChanges}
      <span class="pending-badge">Pending changes</span>
    {/if}
  </div>

  {#if hasPendingChanges}
    <p class="pending-note">Click "Apply Changes" above to re-initialize the simulation with these parameter values.</p>
  {/if}

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
    Social norm (assessment rule + action rule)
    <select
      value={params.socialNormId}
      on:change={(event) => update('socialNormId', (event.currentTarget as HTMLSelectElement).value)}
    >
      {#each socialNormOptions as rule}
        <option value={rule.id}>{rule.name}{rule.source === 'custom' ? ' [Custom]' : ''}</option>
      {/each}
    </select>
  </label>

  <div class="norm-actions">
    <button type="button" on:click={() => dispatch('createCustomNorm')}>Create custom</button>
    <button type="button" on:click={() => dispatch('duplicateSelectedNorm')}>Duplicate selected</button>
    {#if selectedNormSource === 'custom'}
      <button type="button" on:click={() => dispatch('editSelectedNorm')}>Edit selected</button>
    {/if}
  </div>

  <label>
    Assessment mode
    <select
      value={params.assessmentMode}
      on:change={(event) => updateAssessmentMode((event.currentTarget as HTMLSelectElement).value)}
    >
      <option value="private">Private assessment</option>
      <option value="public">Public assessment</option>
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

  .panel.pending {
    border-color: #f0b46a;
    box-shadow: 0 0 0 1px rgba(242, 180, 106, 0.28);
  }

  .title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }

  h2 {
    margin: 0;
    font-size: 1rem;
  }

  .pending-badge {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    background: #fff2df;
    color: #9a3412;
    padding: 0.2rem 0.6rem;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    white-space: nowrap;
  }

  .pending-note {
    margin: 0;
    border-radius: 8px;
    background: #fff8ee;
    color: #9a3412;
    padding: 0.65rem 0.75rem;
    font-size: 0.85rem;
    line-height: 1.4;
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

  .norm-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .message {
    margin: 0;
    font-size: 0.85rem;
    color: #334155;
    white-space: pre-wrap;
  }
</style>
