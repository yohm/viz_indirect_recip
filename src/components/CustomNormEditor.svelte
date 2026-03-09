<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import ActionRuleTable from './ActionRuleTable.svelte'
  import AssessmentRuleTable from './AssessmentRuleTable.svelte'
  import { decodeCustomNormCode, encodeCustomNormCode } from '../lib/sim/customNormCode'
  import type { ActionTable, AssessmentTable, CustomNormCode } from '../lib/sim/types'

  export let code: CustomNormCode

  const dispatch = createEventDispatcher<{
    save: CustomNormCode
    delete: { code: CustomNormCode }
    cancel: void
  }>()

  const initialDecoded = decodeCustomNormCode(code)
  let assessmentTable: AssessmentTable = initialDecoded.assessmentTable
  let actionTable: ActionTable = initialDecoded.actionTable
  let currentCode = code
  let lastLoadedCode = code

  $: if (code !== lastLoadedCode) {
    const decoded = decodeCustomNormCode(code)
    assessmentTable = decoded.assessmentTable
    actionTable = decoded.actionTable
    lastLoadedCode = code
  }

  $: currentCode = encodeCustomNormCode(assessmentTable, actionTable)

  function save(): void {
    dispatch('save', currentCode)
  }

  function assessmentSummary(): string {
    const justifiedDefection = assessmentTable['G-B-D']
    const helpingBadRecipient = assessmentTable['G-B-C']
    return `Bad recipient への defection を ${justifiedDefection}、helping bad recipient を ${helpingBadRecipient} と評価します。`
  }

  function actionSummary(): string {
    const againstBadRecipient = actionTable['G-B']
    const badSelfAgainstBadRecipient = actionTable['B-B']
    return `Self=G, recipient=B では ${againstBadRecipient}、self=B, recipient=B では ${badSelfAgainstBadRecipient} を選びます。`
  }
</script>

<section class="panel">
  <div class="title-row">
    <h2>Custom Norm Editor</h2>
    <div class="button-row">
      <button type="button" on:click={() => dispatch('cancel')}>Close</button>
      <button type="button" on:click={save}>Save changes</button>
      <button type="button" class="danger" on:click={() => dispatch('delete', { code })}>Delete</button>
    </div>
  </div>

  <div class="code-box">
    <span class="code-label">Norm code</span>
    <code>{currentCode}</code>
  </div>

  <section class="subsection">
    <div class="subsection-head">
      <h3>Assessment Rule</h3>
      <p>{assessmentSummary()}</p>
    </div>
    <AssessmentRuleTable table={assessmentTable} on:change={(event) => (assessmentTable = event.detail)} />
  </section>

  <section class="subsection">
    <div class="subsection-head">
      <h3>Action Rule</h3>
      <p>{actionSummary()}</p>
    </div>
    <ActionRuleTable table={actionTable} on:change={(event) => (actionTable = event.detail)} />
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

  .code-box {
    display: grid;
    gap: 0.25rem;
    border: 1px solid #d9dee4;
    border-radius: 10px;
    background: #f8fbfd;
    padding: 0.8rem 0.9rem;
  }

  .code-label {
    font-size: 0.78rem;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  code {
    font-family: 'IBM Plex Mono', 'SFMono-Regular', monospace;
    font-size: 1rem;
    color: #102a43;
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

  .danger {
    border-color: #f2c6c6;
    color: #9f1239;
    background: #fff8f8;
  }
</style>
