<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import ActionRuleTable from './ActionRuleTable.svelte'
  import AssessmentRuleTable from './AssessmentRuleTable.svelte'
  import { decodeCustomNormCode, encodeCustomNormCode } from '../lib/sim/customNormCode'
  import type { ActionTable, AssessmentTable, CustomNormCode } from '../lib/sim/types'

  export let code: CustomNormCode

  const dispatch = createEventDispatcher<{
    save: CustomNormCode
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

</script>

<section class="panel">
  <div class="title-row">
    <h2>Custom Norm Editor</h2>
    <div class="button-row">
      <button type="button" on:click={save}>Done</button>
    </div>
  </div>

  <div class="code-box">
    <span class="code-label">Norm code</span>
    <code>{currentCode}</code>
  </div>

  <section class="subsection">
    <div class="subsection-head">
      <h3>Assessment Rule</h3>
    </div>
    <AssessmentRuleTable table={assessmentTable} on:change={(event) => (assessmentTable = event.detail)} />
  </section>

  <section class="subsection">
    <div class="subsection-head">
      <h3>Action Rule</h3>
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
  .button-row {
    display: flex;
    align-items: start;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  h2,
  h3 {
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
</style>
