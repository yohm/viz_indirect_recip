# Indirect Reciprocity Reputation Simulator

Browser-only interactive simulator and visualization tool for indirect reciprocity with private and public assessment modes.

The app is built with Vite + Svelte + TypeScript and runs as a static site (GitHub Pages compatible).

Live demo: [https://yohm.github.io/viz_indirect_recip/](https://yohm.github.io/viz_indirect_recip/)

## What the app does

- Configures social norm and simulation parameters.
- Supports toggling between monomorphic and polymorphic populations for `N ∈ {30, 60, 150}`.
- Includes bundled **Leading Eight** social-norm presets (L1-L8).
- Runs/pause/step/reset simulation with deterministic seeded randomness.
- Visualizes the image matrix `imageMatrix[observer][target]` on an HTML canvas.
- Shows summary stats (step, cooperation rate, fraction good).
- Displays a recent interaction event log.
- Imports/exports parameter settings as JSON.

## Model assumptions (current MVP)

- Binary reputations: `G` / `B`.
- Population mode is selectable:
  - `monomorphic`: all agents use the selected focal norm.
  - `polymorphic`: the first third of agents are `focal`, the second third are `ALLD`, and the final third are `ALLC`.
- One donor and one recipient sampled each step.
- `focal` donor action is selected by a pluggable `ActionRule(self_rep, recipient_rep)`.
- `ALLD` donors always intend `D`; `ALLC` donors always intend `C`.
- Action error can flip intended donor action.
- Observers are sampled independently by observation probability.
- `focal` observers update only donor image via the selected third-order norm.
- `ALLD` observers always assess the donor as `B`; `ALLC` observers always assess the donor as `G`.
- Assessment error can flip updated reputation.
- Public assessment mode can use `agent[0]` as a fixed observer whose judgment is copied to all agents when observation occurs.

## Install and run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Tests

```bash
npm test
```

Current tests cover deterministic RNG behavior and deterministic stepping behavior.
They also check self-dependent donor action rules and donor-dependent third-order norms.

## GitHub Pages deployment

Published site: [https://yohm.github.io/viz_indirect_recip/](https://yohm.github.io/viz_indirect_recip/)

### One-time GitHub setup

1. Push the repository to GitHub.
2. In GitHub repository settings, enable **Pages** and choose **GitHub Actions** as source.

### Project setup details

- Vite base path is configured in [vite.config.ts](/Users/murase/sandbox/viz_indirect_recip/vite.config.ts).
- Current base is `/viz_indirect_recip/`.
- If repository name changes, update `base` accordingly.

### Deployment workflow

- Workflow file: [.github/workflows/deploy-pages.yml](/Users/murase/sandbox/viz_indirect_recip/.github/workflows/deploy-pages.yml)
- On pushes to `main`, it builds with `npm ci && npm run build` and deploys `dist/` to GitHub Pages.

## Project structure

```text
src/
  main.ts
  App.svelte
  app.css
  lib/
    sim/
      types.ts
      rng.ts
      actionRules.ts
      norms.ts
      state.ts
      initialize.ts
      step.ts
      stats.ts
      events.ts
      index.ts
      __tests__/
        simulation.test.ts
    render/
      imageMatrixCanvas.ts
    utils/
      json.ts
  components/
    ControlPanel.svelte
    SimulationControls.svelte
    MatrixView.svelte
    StatsPanel.svelte
    EventLog.svelte
.github/
  workflows/
    deploy-pages.yml
```

## Architecture notes

### Simulation core is UI-independent

All model logic lives in plain TypeScript modules under `src/lib/sim`.
Svelte components do not implement norm rules or state transitions.

### Norm system

Assessment rules are typed objects implementing `assessDonor(context)` with this context:

- observer's view of donor
- observer's view of recipient
- realized donor action

Preset assessment rules are declared in [src/lib/sim/norms.ts](/Users/murase/sandbox/viz_indirect_recip/src/lib/sim/norms.ts). The canonical public names use Leading Eight identifiers where duplicates previously existed.
This includes standalone presets such as `image-scoring` and `shunning`.

### Action-rule system

Action rules are typed objects implementing `decide(context)` where context includes:

- donor's view of self
- donor's view of recipient

Presets are declared in [src/lib/sim/actionRules.ts](/Users/murase/sandbox/viz_indirect_recip/src/lib/sim/actionRules.ts).
`discriminator` is the canonical donor action rule used by Leading Eight L3-L8 and by the `focal` subpopulation when those norms are selected.

### Social norm system

In this simulator, a social norm is a pair:

- assessment rule
- action rule

Named social norms are declared in [src/lib/sim/socialNormPresets.ts](/Users/murase/sandbox/viz_indirect_recip/src/lib/sim/socialNormPresets.ts) and selected via `socialNormId` in parameters.
In monomorphic mode, the selected norm applies to all agents.
In polymorphic mode, the selected norm is the focal norm applied only by `focal` agents.
Available named presets include `image-scoring`, `shunning`, and the Leading Eight combinations.

### Leading Eight presets

Published Leading Eight combinations are declared in [src/lib/sim/socialNormPresets.ts](/Users/murase/sandbox/viz_indirect_recip/src/lib/sim/socialNormPresets.ts).
In the UI, selecting a Leading Eight entry picks the paired assessment/action definition.
Canonical naming notes:

- `leading-eight-l3` is the canonical replacement for the old `simple-standing` label.
- `leading-eight-l6` is the canonical replacement for the old `stern-judging` label.
- `leading-eight-l8` is the canonical replacement for the old `contrite-judging` label.

### Determinism and reproducibility

- Seeded xorshift32 RNG in [src/lib/sim/rng.ts](/Users/murase/sandbox/viz_indirect_recip/src/lib/sim/rng.ts).
- RNG internal state is stored in simulation state and advanced only by deterministic step logic.
- Re-initializing with identical parameters and seed reproduces runs.

### State flow

1. `App.svelte` holds editable settings and current simulation state.
2. Controls update editable settings only.
3. Initialize/Reset validates settings and creates a new simulation state.
4. Step/Run calls `stepSimulation(state)` and replaces state with returned next state.
5. UI panels render state and computed stats.

### Canvas rendering

Canvas drawing is centralized in [src/lib/render/imageMatrixCanvas.ts](/Users/murase/sandbox/viz_indirect_recip/src/lib/render/imageMatrixCanvas.ts).
`MatrixView.svelte` only passes matrix data and handles pointer interactions.

## Current limitations

- No recipient reputation updates yet.
- No gossip or transmission channel.
- Reputations are binary only (`G`/`B`).

## Future extensions

- Ternary reputations (`G`/`B`/`U`).
- User-defined population composition beyond the fixed equal thirds.
- Recipient and third-party updates in one interaction.
- Public/private hybrid reputation layers.
- Punishment costs/payoffs and evolutionary dynamics.
- Event replay and trajectory export (CSV/JSONL).
