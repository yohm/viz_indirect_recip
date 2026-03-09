import { describe, expect, it } from 'vitest'
import { getActionRuleById } from '../actionRules'
import { initializeSimulation } from '../initialize'
import { getNormById } from '../norms'
import { createRng } from '../rng'
import { getSocialNormById } from '../socialNormPresets'
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

describe('norms', () => {
  it('supports third-order norm dependence on donor reputation input', () => {
    const norm = getNormById('leading-eight-l8')

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

describe('canonical IDs', () => {
  it('uses discriminator as the canonical replacement for recipient-discriminator', () => {
    const rule = getActionRuleById('discriminator')

    expect(
      rule.decide({
        donor: 0,
        recipient: 1,
        donorViewOfSelf: 'G',
        donorViewOfRecipient: 'G',
      }),
    ).toBe('C')
    expect(
      rule.decide({
        donor: 0,
        recipient: 1,
        donorViewOfSelf: 'B',
        donorViewOfRecipient: 'B',
      }),
    ).toBe('D')
  })

  it('keeps L3 and L6 as canonical social norm IDs', () => {
    expect(getSocialNormById('leading-eight-l3').id).toBe('leading-eight-l3')
    expect(getSocialNormById('leading-eight-l6').id).toBe('leading-eight-l6')
  })

  it('rejects removed legacy social norm IDs', () => {
    expect(() => validateParameters({ ...DEFAULT_PARAMETERS, socialNormId: 'stern-judging' })).toThrow(
      'Unknown social norm id: stern-judging',
    )
    expect(() => validateParameters({ ...DEFAULT_PARAMETERS, socialNormId: 'simple-standing' })).toThrow(
      'Unknown social norm id: simple-standing',
    )
    expect(() => validateParameters({ ...DEFAULT_PARAMETERS, socialNormId: 'contrite-judging' })).toThrow(
      'Unknown social norm id: contrite-judging',
    )
    expect(() => validateParameters({ ...DEFAULT_PARAMETERS, socialNormId: 'self-conscious' })).toThrow(
      'Unknown social norm id: self-conscious',
    )
    expect(() => validateParameters({ ...DEFAULT_PARAMETERS, socialNormId: 'self-confident' })).toThrow(
      'Unknown social norm id: self-confident',
    )
  })

  it('rejects removed action rule IDs', () => {
    expect(() => getActionRuleById('self-conscious')).toThrow('Unknown action rule id: self-conscious')
    expect(() => getActionRuleById('self-confident')).toThrow('Unknown action rule id: self-confident')
  })
})
