# Indirect Reciprocity Simulator

## Model Specification

This document specifies the **mathematical model** implemented in the indirect reciprocity simulator.

The purpose of this document is to clearly define the model assumptions so that both **humans and coding agents** can correctly implement the simulator.

The simulator implements an **indirect reciprocity model with private reputations and third-order social norms**.

---

# 1. Overview

The model simulates cooperation sustained through **indirect reciprocity**.

Agents interact through repeated **donation games**.

Reputation information is **private**:

different agents may hold different reputations for the same individual.

The simulator visualizes the evolution of these reputations under different **third-order social norms**.

---

# 2. Agents

Let

```
N
```

be the number of agents.

Agents are indexed by

```
i = 1, 2, ..., N
```

Time proceeds in discrete interaction steps.

---

# 3. Reputation System

Each agent maintains a private reputation for every agent.

This is represented by the **image matrix**

```
R[o][t]
```

where

```
o : observer
t : target agent
```

Interpretation

```
R[o][t] = reputation assigned by observer o to target t
```

---

## Reputation Values

In the current simulator reputations are binary:

```
G : Good
B : Bad
```

Future versions may extend this to include:

```
U : Unknown
```

---

# 4. Interaction Game

Each step corresponds to a **donation game**.

Two agents are randomly selected:

```
donor = i
recipient = j
```

with

```
i ≠ j
```

---

## Actions

The donor chooses an action

```
C : cooperate
D : defect
```

Interpretation:

If the donor cooperates:

```
donor pays cost c
recipient receives benefit b
```

with

```
b > c > 0
```

If the donor defects:

```
no payoff change
```

Tracking payoffs is optional in the simulator.

---

# 5. Donor Decision Rule

The donor determines their intended action based on **their private reputations**.

The decision depends on:

```
donor's opinion about themselves
donor's opinion about the recipient
```

Formally:

```
self_rep = R[i][i]
recipient_rep = R[i][j]
```

The intended action is determined by an **action rule**.

```
action = ActionRule(self_rep, recipient_rep)
```

---

## Action Rule

An action rule maps reputations to actions:

```
ActionRule : {G,B} × {G,B} → {C,D}
```

Inputs:

```
self_rep ∈ {G,B}
recipient_rep ∈ {G,B}
```

Output:

```
action ∈ {C,D}
```

This corresponds to **four possible input combinations**.

Example table:

| self_rep | recipient_rep | action |
| -------- | ------------- | ------ |
| G        | G             | C      |
| G        | B             | D      |
| B        | G             | C      |
| B        | B             | D      |

This example corresponds to a strategy where agents cooperate with good recipients regardless of their own reputation.

Different action rules correspond to different behavioral strategies.

---

## Typical Strategy

A common strategy used in indirect reciprocity models is:

```
cooperate with good recipients
defect against bad recipients
```

This strategy ignores the self reputation:

```
ActionRule(self_rep, recipient_rep) =
    C if recipient_rep = G
    D if recipient_rep = B
```

However, the simulator allows more general action rules that may depend on the donor's own reputation.

This flexibility is useful for exploring more complex behavioral dynamics.

---

# 6. Action Error

With probability

```
ε_action
```

the intended action is flipped.

Examples:

```
C → D
D → C
```

This models implementation mistakes.

---

# 7. Observation Process

Each agent independently observes the interaction with probability

```
q
```

where

```
0 ≤ q ≤ 1
```

The resulting observer set is

```
O ⊆ {1,...,N}
```

Only observing agents update reputations.

Non-observers keep their previous beliefs.

---

# 8. Reputation Update

Each observing agent updates their opinion of the **donor**.

The update depends on:

```
observer's opinion of the donor
observer's opinion of the recipient
realized donor action
social norm
```

Formally:

```
R[o][donor] ← Norm( R[o][donor], R[o][recipient], action )
```

This is a **third-order assessment rule**.

The reputation update therefore depends on three pieces of information:

1. donor reputation
2. recipient reputation
3. donor action

---

# 9. Assessment Error

With probability

```
ε_assess
```

the assigned reputation is flipped.

Example:

```
G → B
B → G
```

This represents mistakes in moral evaluation.

---

# 10. Third-Order Social Norm

A **third-order norm** determines the reputation assigned to the donor.

Conceptually:

```
new_rep = Norm(donor_rep, recipient_rep, action)
```

Inputs:

```
donor_rep ∈ {G, B}
recipient_rep ∈ {G, B}
action ∈ {C, D}
```

Output:

```
new_rep ∈ {G, B}
```

---

## Norm Representation

A norm can be represented as a mapping

```
{G,B} × {G,B} × {C,D} → {G,B}
```

This corresponds to **8 possible input combinations**.

Example table:

| donor_rep | recipient_rep | action | new_rep |
| --------- | ------------- | ------ | ------- |
| G         | G             | C      | G       |
| G         | G             | D      | B       |
| G         | B             | C      | B       |
| G         | B             | D      | G       |
| B         | G             | C      | G       |
| B         | G             | D      | B       |
| B         | B             | C      | B       |
| B         | B             | D      | B       |

Different social norms correspond to different mappings.

The simulator should allow **multiple norm presets**.

Norm implementations must be modular so new norms can easily be added.

---

# 11. Initialization

The simulator should support several initial conditions.

### All Good

```
R[o][t] = G
```

for all

```
o,t
```

---

### Random Initialization

Each entry is assigned randomly

```
P(G) = 0.5
P(B) = 0.5
```

---

# 12. Simulation Loop

Each simulation step executes:

```
1. choose donor and recipient
2. donor determines intended action
3. apply action error
4. determine observer set
5. observers update donor reputation using the norm
6. apply assessment error
7. record event
8. update statistics
```

---

# 13. Statistics

The simulator should track several statistics.

### Cooperation Rate

```
fraction of interactions with action C
```

---

### Reputation Distribution

```
fraction of Good reputations in the image matrix
```

---

### Event Log

Each interaction should record:

```
step number
donor
recipient
intended action
realized action
observer set
reputation updates
```

This is useful for debugging and visualization.

---

# 14. Randomness and Reproducibility

All randomness must use a **seeded random number generator**.

Given identical parameters and seed:

```
the simulation must be reproducible
```

---

# 15. Visualization

The simulator visualizes the image matrix

```
R[o][t]
```

as a grid.

```
rows = observers
columns = targets
```

Example colors:

```
Good → light color
Bad → dark color
```

The visualization updates dynamically as the simulation progresses.

---

# 16. Future Extensions

The architecture should allow extensions such as:

* ternary reputations
* public reputation systems
* gossip transmission
* punishment actions
* networked interactions
* batch experiments
* large-scale simulations

The design should not prevent these extensions.

---

# 17. Summary

The simulator models indirect reciprocity with:

```
agents
private reputation matrix
donation game interactions
third-order social norms
observation probability
action errors
assessment errors
```

The goal is to explore how **social norms sustain cooperation through decentralized reputation systems**.
