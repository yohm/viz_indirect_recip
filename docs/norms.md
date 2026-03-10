# Named Norm Definitions

This file summarizes the currently implemented named norms in the simulator.

In this project, a **social norm** is defined as:

`social norm = assessment rule + action rule`

## Common notation

- Reputations: `G` (Good), `B` (Bad)
- Actions: `C` (Cooperate), `D` (Defect)
- Assessment context for norms: `(observerViewOfDonor, observerViewOfRecipient, realizedAction)`
- Output: updated donor image in observer's private matrix (`G` or `B`)

## Assessment rules (named)

### Image Scoring (`image-scoring`)
Definition:
- `C -> G`, `D -> B`, independent of donor/recipient reputations.

## Leading Eight assessment rules (L1-L8)

The simulator includes all eight named assessment tables as individual norms:

- `leading-eight-l1`
- `leading-eight-l2` (Standing)
- `leading-eight-l3` (Simple Standing)
- `leading-eight-l4`
- `leading-eight-l5`
- `leading-eight-l6` (Stern Judging)
- `leading-eight-l7`
- `leading-eight-l8` (Judging; canonical replacement for the old `contrite-judging` label in this codebase)

Each of these is implemented as a full third-order table over all 8 input combinations:

`(donor_rep in {G,B}) x (recipient_rep in {G,B}) x (action in {C,D}) -> {G,B}`

## Action rules

In this simulator, a social behavior preset is a pair:

- assessment norm table
- donor action rule

Leading Eight presets use one of two donor action rules:

### L1/L2 action rule (`leading-eight-l1-l2`)
- `GG -> C`
- `GB -> D`
- `BG -> C`
- `BB -> C`

### Discriminator (`discriminator`)
- `GG -> C`
- `GB -> D`
- `BG -> C`
- `BB -> D`

(Notation above is `(donorViewOfSelf, donorViewOfRecipient) -> action`.)

## Social norm presets (pair definitions)

Named social norms are implemented as explicit pairs in `src/lib/sim/socialNormPresets.ts`.

The selected named social norm always acts as the **focal norm**:

- in `monomorphic` mode, all agents use both its assessment rule and action rule
- in `polymorphic` mode, only `focal` agents use both its assessment rule and action rule, while `ALLD` agents always defect and assess donors as `B`, and `ALLC` agents always cooperate and assess donors as `G`

Examples:

- `image-scoring` = (`assessmentRuleId = image-scoring`, `actionRuleId = discriminator`)
- `leading-eight-l6` = (`assessmentRuleId = leading-eight-l6`, `actionRuleId = discriminator`)
- `leading-eight-l8` = (`assessmentRuleId = leading-eight-l8`, `actionRuleId = discriminator`)

## Canonical naming notes

- `leading-eight-l3` is the canonical replacement for the old `simple-standing` name.
- `leading-eight-l6` is the canonical replacement for the old `stern-judging` name.
- `leading-eight-l8` is the canonical replacement for the old `contrite-judging` name.

## Where definitions live in code

- Assessment norms: `src/lib/sim/norms.ts`
- Action rules: `src/lib/sim/actionRules.ts`
- Social norm pairings: `src/lib/sim/socialNormPresets.ts`
