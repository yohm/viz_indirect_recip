import { describe, expect, it } from 'vitest'
import { initializeSimulation } from '../initialize'
import { createRng } from '../rng'
import { DEFAULT_PARAMETERS, validateParameters } from '../state'
import { stepSimulation } from '../step'

function makeParams(overrides: Partial<typeof DEFAULT_PARAMETERS> = {}) {
  return validateParameters({ ...DEFAULT_PARAMETERS, ...overrides })
}

describe('seeded rng', () => {
  it('produces deterministic sequence for same seed', () => {
    const a = createRng(12345)
    const b = createRng(12345)

    const seqA = [a.next(), a.next(), a.next(), a.nextInt(100), a.nextBool(0.5)]
    const seqB = [b.next(), b.next(), b.next(), b.nextInt(100), b.nextBool(0.5)]

    expect(seqA).toEqual(seqB)
  })
})

describe('simulation step', () => {
  it('is deterministic for same initial state', () => {
    const params = makeParams({
      numAgents: 12,
      seed: 99,
      observationProbability: 0.8,
      actionErrorProbability: 0.1,
      assessmentErrorProbability: 0.05,
      initialReputationMode: 'random',
    })

    const initialA = initializeSimulation(params)
    const initialB = initializeSimulation(params)

    const afterA = stepSimulation(initialA).nextState
    const afterB = stepSimulation(initialB).nextState

    expect(afterA).toEqual(afterB)
  })

  it('always flips intended action when action error probability is 1', () => {
    const params = makeParams({
      numAgents: 6,
      seed: 7,
      observationProbability: 1,
      actionErrorProbability: 1,
      assessmentErrorProbability: 0,
      initialReputationMode: 'all-good',
    })

    const initial = initializeSimulation(params)
    const result = stepSimulation(initial)

    expect(result.event.intendedAction).not.toBe(result.event.realizedAction)
  })
})
