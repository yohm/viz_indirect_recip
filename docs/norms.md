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

### Simple Standing (`simple-standing`)
Definition:
- Cooperation is always `G`.
- Defection against `G` recipient is `B`.
- Defection against `B` recipient is `G`.
- Independent of prior donor image.

### Stern Judging (`stern-judging`)
Definition:
- `C` to `G` recipient -> `G`
- `D` to `B` recipient -> `G`
- `D` to `G` recipient -> `B`
- `C` to `B` recipient -> `B`
- Independent of prior donor image.

### Contrite Judging (`contrite-judging`)
Definition:
- Same as stern judging except one donor-dependent case differs.
- If observer sees donor as `B`, and donor defects against `B`, then update is `B` (stricter).
- This is included as an explicit third-order example because donor image affects outcome.

## Leading Eight assessment rules (L1-L8)

The simulator includes all eight named assessment tables as individual norms:

- `leading-eight-l1`
- `leading-eight-l2` (Standing)
- `leading-eight-l3` (Simple Standing)
- `leading-eight-l4`
- `leading-eight-l5`
- `leading-eight-l6` (Stern Judging)
- `leading-eight-l7`
- `leading-eight-l8` (Judging)

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

### L3-L8 action rule (`leading-eight-l3-l8`)
- `GG -> C`
- `GB -> D`
- `BG -> C`
- `BB -> D`

(Notation above is `(donorViewOfSelf, donorViewOfRecipient) -> action`.)

## Social norm presets (pair definitions)

Named social norms are implemented as explicit pairs in `src/lib/sim/socialNormPresets.ts`.

Examples:

- `stern-judging` = (`assessmentRuleId = stern-judging`, `actionRuleId = recipient-discriminator`)
- `leading-eight-l6` = (`assessmentRuleId = leading-eight-l6`, `actionRuleId = leading-eight-l3-l8`)

## Where definitions live in code

- Assessment norms: `src/lib/sim/norms.ts`
- Action rules: `src/lib/sim/actionRules.ts`
- Social norm pairings: `src/lib/sim/socialNormPresets.ts`
