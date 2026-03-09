import { describe, expect, it } from 'vitest'
import { getActionRuleById } from '../actionRules'
import { initializeSimulation } from '../initialize'
import { getNormById } from '../norms'
import { createRng } from '../rng'
import { resolveSocialNorm } from '../socialNormCatalog'
import { getSocialNormById } from '../socialNormPresets'
import { DEFAULT_PARAMETERS, validateParameters } from '../state'
import { COOPERATION_RATE_WINDOW, appendTimeSeriesPoint, computeStats, toTimeSeriesPoint } from '../stats'
import { stepSimulation } from '../step'
import type { CustomNormCode, Reputation, SimulationState } from '../types'

function makeParams(
  overrides: Partial<typeof DEFAULT_PARAMETERS> = {},
  customNorms: CustomNormCode[] = [],
) {
  return validateParameters({ ...DEFAULT_PARAMETERS, ...overrides }, customNorms)
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

  it('keeps public assessment deterministic for same initial state', () => {
    const params = makeParams({
      numAgents: 8,
      seed: 19,
      observationProbability: 0.65,
      actionErrorProbability: 0.1,
      assessmentErrorProbability: 0.05,
      initialReputationMode: 'random',
      assessmentMode: 'public',
    })

    const initialA = initializeSimulation(params)
    const initialB = initializeSimulation(params)

    const resultA = stepSimulation(initialA)
    const resultB = stepSimulation(initialB)

    expect(resultA).toEqual(resultB)
  })

  it('synchronizes the donor column in public assessment when agent 0 observes', () => {
    const params = makeParams({
      numAgents: 5,
      seed: 23,
      socialNormId: 'image-scoring',
      observationProbability: 1,
      actionErrorProbability: 0,
      assessmentErrorProbability: 0,
      assessmentMode: 'public',
    })

    const initial = initializeSimulation(params)
    const { nextState, event } = stepSimulation(initial)
    const donorColumn = nextState.imageMatrix.map((row) => row[event.donor])

    expect(event.assessor).toBe(0)
    expect(event.observingAgents).toEqual([0])
    expect(new Set(donorColumn)).toEqual(new Set([donorColumn[0]]))
  })

  it('leaves the donor column unchanged in public assessment when agent 0 does not observe', () => {
    const params = makeParams({
      numAgents: 5,
      seed: 31,
      socialNormId: 'image-scoring',
      observationProbability: 0,
      actionErrorProbability: 0,
      assessmentErrorProbability: 0,
      assessmentMode: 'public',
    })

    const initial = initializeSimulation(params)
    const beforeStep = initial.imageMatrix.map((row) => [...row])
    const { nextState, event } = stepSimulation(initial)

    expect(event.assessor).toBeNull()
    expect(event.observingAgents).toEqual([])
    expect(event.reputationChanges).toEqual([])
    expect(nextState.imageMatrix).toEqual(beforeStep)
  })

  it('uses agent 0 views as the public assessment source', () => {
    const params = makeParams({
      numAgents: 4,
      seed: 17,
      socialNormId: 'leading-eight-l8',
      observationProbability: 1,
      actionErrorProbability: 0,
      assessmentErrorProbability: 0,
      assessmentMode: 'public',
    })

    const probeEvent = stepSimulation(initializeSimulation(params)).event
    const donor = probeEvent.donor
    const recipient = probeEvent.recipient
    const imageMatrix: Reputation[][] = Array.from({ length: params.numAgents }, () =>
      Array.from({ length: params.numAgents }, () => 'G'),
    )

    imageMatrix[donor][recipient] = 'B'
    imageMatrix[0][donor] = 'B'
    imageMatrix[0][recipient] = 'B'
    for (let observer = 1; observer < params.numAgents; observer += 1) {
      imageMatrix[observer][donor] = 'G'
      imageMatrix[observer][recipient] = 'B'
    }

    const initial: SimulationState = {
      params,
      imageMatrix,
      step: 0,
      interactionCount: 0,
      cooperationCount: 0,
      recentActions: [],
      rngState: params.seed,
      events: [],
    }

    const { nextState, event } = stepSimulation(initial)
    const donorColumn = nextState.imageMatrix.map((row) => row[event.donor])

    expect(event.assessor).toBe(0)
    expect(event.realizedAction).toBe('D')
    expect(donorColumn).toEqual(Array(params.numAgents).fill('B'))
  })

  it('supports stepping with a user-defined custom norm', () => {
    const customNorm = 'GBBGGBBG-CDCD'
    const params = makeParams(
      {
        socialNormId: customNorm,
        numAgents: 6,
        seed: 29,
        initialReputationMode: 'random',
      },
      [customNorm],
    )

    const initial = initializeSimulation(params)
    const result = stepSimulation(initial, [customNorm])
    const resolved = resolveSocialNorm(customNorm, [customNorm])

    expect(result.nextState.step).toBe(1)
    expect(resolved.source).toBe('custom')
  })
})

describe('time series history', () => {
  it('starts with the step 0 snapshot when initialized from current stats', () => {
    const initial = initializeSimulation(makeParams())
    const stats = computeStats(initial)

    expect(toTimeSeriesPoint(stats)).toEqual({
      step: 0,
      cooperationRate: 0,
      fractionGood: 1,
    })
  })

  it('appends one point per step using the latest stats snapshot', () => {
    const initial = initializeSimulation(
      makeParams({
        seed: 11,
        numAgents: 8,
        initialReputationMode: 'random',
      }),
    )
    const firstPoint = toTimeSeriesPoint(computeStats(initial))
    const { nextState } = stepSimulation(initial)
    const latestStats = computeStats(nextState)

    const history = appendTimeSeriesPoint([firstPoint], toTimeSeriesPoint(latestStats), 500)

    expect(history).toHaveLength(2)
    expect(history.at(-1)).toEqual({
      step: latestStats.step,
      cooperationRate: latestStats.cooperationRate,
      fractionGood: latestStats.fractionGood,
    })
  })

  it('keeps only the most recent 500 points', () => {
    let history = [toTimeSeriesPoint(computeStats(initializeSimulation(makeParams())))]

    for (let step = 1; step <= 500; step += 1) {
      history = appendTimeSeriesPoint(
        history,
        {
          step,
          cooperationRate: step / 500,
          fractionGood: 1 - step / 1000,
        },
        500,
      )
    }

    expect(history).toHaveLength(500)
    expect(history[0].step).toBe(1)
    expect(history.at(-1)?.step).toBe(500)
  })
})

describe('cooperation rate window', () => {
  it('uses the recent 100-step window instead of the cumulative interaction count', () => {
    const initial = initializeSimulation(makeParams())
    const recentActions = Array.from({ length: COOPERATION_RATE_WINDOW }, (_, index) => (index < 40 ? 'C' : 'D')) as (
      | 'C'
      | 'D'
    )[]

    const stats = computeStats({
      ...initial,
      interactionCount: 900,
      cooperationCount: 700,
      recentActions,
    })

    expect(stats.cooperationRate).toBe(40 / COOPERATION_RATE_WINDOW)
  })

  it('retains only the most recent 100 realized actions in state', () => {
    let state = initializeSimulation(
      makeParams({
        socialNormId: 'image-scoring',
        actionErrorProbability: 0,
        observationProbability: 0,
      }),
    )

    for (let index = 0; index < COOPERATION_RATE_WINDOW + 25; index += 1) {
      state = stepSimulation(state).nextState
    }

    expect(state.recentActions).toHaveLength(COOPERATION_RATE_WINDOW)
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

  it('implements the shunning assessment table', () => {
    const norm = getNormById('shunning')

    expect(
      norm.assessDonor({
        observerViewOfDonor: 'G',
        observerViewOfRecipient: 'B',
        realizedAction: 'C',
      }),
    ).toBe('B')
    expect(
      norm.assessDonor({
        observerViewOfDonor: 'B',
        observerViewOfRecipient: 'G',
        realizedAction: 'C',
      }),
    ).toBe('G')
    expect(
      norm.assessDonor({
        observerViewOfDonor: 'B',
        observerViewOfRecipient: 'B',
        realizedAction: 'D',
      }),
    ).toBe('B')
  })
})

describe('canonical IDs', () => {
  it('rejects invalid assessment modes', () => {
    expect(() => validateParameters({ ...DEFAULT_PARAMETERS, assessmentMode: 'shared' as 'private' })).toThrow(
      'assessmentMode must be either "private" or "public".',
    )
  })

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
