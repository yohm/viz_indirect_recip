<script lang="ts">
  import type { SimulationStats } from '../lib/sim/types'

  export let stats: SimulationStats
</script>

<section class="panel">
  <h2>Summary</h2>
  <dl>
    <div>
      <dt>Step</dt>
      <dd>{stats.step}</dd>
    </div>
    {#if stats.kind === 'monomorphic'}
      <div>
        <dt>
          Cooperation rate
          <span class="subtle-label">last 100 steps</span>
        </dt>
        <dd>{(stats.cooperationRate * 100).toFixed(1)}%</dd>
      </div>
      <div>
        <dt>Fraction good</dt>
        <dd>{(stats.fractionGood * 100).toFixed(1)}%</dd>
      </div>
    {:else}
      <div>
        <dt>
          Focal payoff
          <span class="subtle-label">5 x recv. coop prob. - donor coop prob., last 100 steps</span>
        </dt>
        <dd>{stats.focalPayoff.toFixed(2)}</dd>
      </div>
      <div>
        <dt>
          ALLD payoff
          <span class="subtle-label">5 x recv. coop prob. - donor coop prob., last 100 steps</span>
        </dt>
        <dd>{stats.alldPayoff.toFixed(2)}</dd>
      </div>
      <div>
        <dt>
          ALLC payoff
          <span class="subtle-label">5 x recv. coop prob. - donor coop prob., last 100 steps</span>
        </dt>
        <dd>{stats.allcPayoff.toFixed(2)}</dd>
      </div>
    {/if}
  </dl>
</section>

<style>
  .panel {
    background: #ffffff;
    border: 1px solid #d9dee4;
    border-radius: 10px;
    padding: 1rem;
  }

  h2 {
    margin: 0 0 0.6rem;
    font-size: 1rem;
  }

  dl {
    margin: 0;
    display: grid;
    gap: 0.5rem;
  }

  div {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    border-bottom: 1px solid #edf1f6;
    padding-bottom: 0.3rem;
  }

  dt {
    color: #4b5563;
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    align-items: baseline;
  }

  .subtle-label {
    color: #7b8794;
    font-size: 0.78rem;
    font-weight: 500;
  }

  dd {
    margin: 0;
    font-weight: 600;
  }
</style>
