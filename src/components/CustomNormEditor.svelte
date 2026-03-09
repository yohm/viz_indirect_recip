<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import ActionRuleTable from './ActionRuleTable.svelte'
  import AssessmentRuleTable from './AssessmentRuleTable.svelte'
  import type { CustomSocialNormDefinition } from '../lib/sim/types'

  export let norm: CustomSocialNormDefinition

  const dispatch = createEventDispatcher<{
    save: CustomSocialNormDefinition
    delete: { id: string }
    cancel: void
  }>()

  let draft = cloneNorm(norm)

  $: if (norm.id !== draft.id) {
    draft = cloneNorm(norm)
  }

  function cloneNorm(value: CustomSocialNormDefinition): CustomSocialNormDefinition {
    return {
      ...value,
      assessmentRule: {
        ...value.assessmentRule,
        table: { ...value.assessmentRule.table },
      },
      actionRule: {
        ...value.actionRule,
        table: { ...value.actionRule.table },
      },
    }
  }

  function save(): void {
    draft.assessmentRule.id = `${draft.id}-assessment`
    draft.assessmentRule.name = `${draft.name} Assessment`
    draft.actionRule.id = `${draft.id}-action`
    draft.actionRule.name = `${draft.name} Action`
    dispatch('save', cloneNorm(draft))
  }

  function assessmentSummary(): string {
    const justifiedDefection = draft.assessmentRule.table['G-B-D']
    const helpingBadRecipient = draft.assessmentRule.table['G-B-C']
    return `Assesses defection against bad recipients as ${justifiedDefection} and helping bad recipients as ${helpingBadRecipient}.`
  }

  function actionSummary(): string {
    const againstBadRecipient = draft.actionRule.table['G-B']
    const badSelfAgainstBadRecipient = draft.actionRule.table['B-B']
    return `Chooses ${againstBadRecipient} against bad recipients when self-image is good, and ${badSelfAgainstBadRecipient} when both self and recipient are bad.`
  }
</script>

<section class="panel">
  <div class="title-row">
    <h2>Custom Norm Editor</h2>
    <div class="button-row">
      <button type="button" on:click={() => dispatch('cancel')}>Close</button>
      <button type="button" on:click={save}>Save changes</button>
      <button type="button" class="danger" on:click={() => dispatch('delete', { id: norm.id })}>Delete</button>
    </div>
  </div>

  <label>
    Name
    <input type="text" bind:value={draft.name} />
  </label>

  <label>
    Identifier
    <input type="text" bind:value={draft.id} />
  </label>

  <label>
    Description
    <textarea rows="3" bind:value={draft.description}></textarea>
  </label>

  <section class="subsection">
    <div class="subsection-head">
      <h3>Assessment Rule</h3>
      <p>{assessmentSummary()}</p>
    </div>
    <AssessmentRuleTable table={draft.assessmentRule.table} on:change={(event) => (draft.assessmentRule.table = event.detail)} />
  </section>

  <section class="subsection">
    <div class="subsection-head">
      <h3>Action Rule</h3>
      <p>{actionSummary()}</p>
    </div>
    <ActionRuleTable table={draft.actionRule.table} on:change={(event) => (draft.actionRule.table = event.detail)} />
  </section>
</section>

<style>
  .panel {
    display: grid;
    gap: 0.9rem;
    background: #ffffff;
    border: 1px solid #d9dee4;
    border-radius: 10px;
    padding: 1rem;
  }

  .title-row,
  .button-row,
  .subsection-head {
    display: flex;
    align-items: start;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  h2,
  h3,
  p {
    margin: 0;
  }

  .subsection {
    display: grid;
    gap: 0.7rem;
  }

  .subsection-head p {
    max-width: 42rem;
    font-size: 0.85rem;
    color: #475569;
    line-height: 1.5;
  }

  label {
    display: grid;
    gap: 0.25rem;
    font-size: 0.9rem;
  }

  input,
  textarea {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid #cfd8e3;
    border-radius: 6px;
    padding: 0.5rem;
    font: inherit;
  }

  .danger {
    border-color: #f2c6c6;
    color: #9f1239;
    background: #fff8f8;
  }
</style>
