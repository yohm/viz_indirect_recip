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
  <div class="editor-grid">
    <section class="main-pane">
      <div class="section-head">
        <h3>Assessment Rule</h3>
      </div>
      <AssessmentRuleTable table={assessmentTable} on:change={(event) => (assessmentTable = event.detail)} />
    </section>

    <aside class="side-pane">
      <div class="section-head">
        <h3>Action Rule</h3>
      </div>
      <ActionRuleTable table={actionTable} on:change={(event) => (actionTable = event.detail)} />
    </aside>
  </div>

  <div class="editor-footer">
    <div class="code-box">
      <span class="code-label">Norm code</span>
      <code>{currentCode}</code>
    </div>
    <button type="button" class="apply-button" on:click={save}>Apply custom norm</button>
  </div>
</section>

<style>
  .panel {
    display: block;
  }

  .editor-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(320px, 0.95fr);
    gap: 0.85rem;
    align-items: start;
    margin-bottom: 0.95rem;
  }

  h3 {
    margin: 0;
    font-size: 0.98rem;
  }

  .main-pane,
  .side-pane {
    display: grid;
    gap: 0.6rem;
    align-content: start;
  }

  .section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 2rem;
  }

  .editor-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.6rem;
    align-items: stretch;
    padding-top: 0.1rem;
  }

  .code-box {
    display: grid;
    gap: 0.25rem;
    border: 1px solid #d9dee4;
    border-radius: 12px;
    background: #f8fbfd;
    min-width: 0;
    width: fit-content;
    max-width: 100%;
    padding: 0.75rem 0.85rem 0.8rem;
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
    font-size: 0.98rem;
    color: #102a43;
    word-break: break-all;
  }

  .apply-button {
    min-width: 13.5rem;
    padding: 0.6rem 1rem;
    font-weight: 700;
  }

  @media (max-width: 980px) {
    .editor-grid {
      grid-template-columns: 1fr;
    }

    .editor-footer {
      display: grid;
      grid-template-columns: 1fr;
    }

    .apply-button {
      min-width: 0;
      width: 100%;
    }
  }
</style>
