import { describe, expect, it } from 'vitest'
import { initializeSimulation } from '../initialize'
import { getNormById } from '../norms'
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

  it('supports action rules that depend on self-image', () => {
    const params = makeParams({
      numAgents: 10,
      seed: 123,
      observationProbability: 0,
      actionErrorProbability: 0,
      assessmentErrorProbability: 0,
      initialReputationMode: 'random',
      actionRuleId: 'self-conscious',
    })

    const initial = initializeSimulation(params)
    const result = stepSimulation(initial)
    const donor = result.event.donor
    const recipient = result.event.recipient

    const selfRep = initial.imageMatrix[donor][donor]
    const recipientRep = initial.imageMatrix[donor][recipient]
    const expectedAction = selfRep === 'B' ? 'D' : recipientRep === 'G' ? 'C' : 'D'

    expect(result.event.intendedAction).toBe(expectedAction)
  })
})

describe('norms', () => {
  it('supports third-order norm dependence on donor reputation input', () => {
    const norm = getNormById('contrite-judging')

    const whenDonorGood = norm.assessDonor({
      observerViewOfDonor: 'G',
      observerViewOfRecipient: 'B',
      realizedAction: 'D',
    })

    const whenDonorBad = norm.assessDonor({
      observerViewOfDonor: 'B',
      observerViewOfRecipient: 'B',
      realizedAction: 'D',
    })

    expect(whenDonorGood).toBe('G')
    expect(whenDonorBad).toBe('B')
  })
})
