import { describe, expect, it } from 'vitest'
import { getActionRuleById } from '../actionRules'
import { initializeSimulation } from '../initialize'
import { getNormById } from '../norms'
import { buildAgentStrategies } from '../population'
import { createRng } from '../rng'
import { resolveSocialNorm } from '../socialNormCatalog'
import { getSocialNormById } from '../socialNormPresets'
import { DEFAULT_PARAMETERS, validateParameters } from '../state'
import { ROLLING_WINDOW_SIZE, appendTimeSeriesPoint, computeStats, toTimeSeriesPoint } from '../stats'
import { stepSimulation } from '../step'
import type { CustomNormCode, Reputation, SimulationState, TimeSeriesPoint } from '../types'

function makeParams(
  overrides: Partial<typeof DEFAULT_PARAMETERS> = {},
  customNorms: CustomNormCode[] = [],
) {
  return validateParameters({ ...DEFAULT_PARAMETERS, ...overrides }, customNorms)
}

function findSeedForDonorStrategy(
  strategy: 'focal' | 'alld' | 'allc',
  overrides: Partial<typeof DEFAULT_PARAMETERS> = {},
): { seed: number; donor: number; recipient: number } {
  for (let seed = 0; seed < 100_000; seed += 1) {
    const params = makeParams({ ...overrides, seed })
    const initial = initializeSimulation(params)
    const { event } = stepSimulation(initial)
    if (initial.agentStrategies[event.donor] === strategy) {
      return {
        seed,
        donor: event.donor,
        recipient: event.recipient,
      }
    }
  }

  throw new Error(`Unable to find seed for donor strategy ${strategy}`)
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
      numAgents: 30,
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
      numAgents: 30,
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
      numAgents: 30,
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
      numAgents: 30,
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
      numAgents: 30,
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
      numAgents: 30,
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
      agentStrategies: buildAgentStrategies(params.numAgents, params.populationMode),
      imageMatrix,
      step: 0,
      interactionCount: 0,
      cooperationCount: 0,
      recentActions: [],
      recentInteractionSummaries: [],
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
        numAgents: 30,
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
      kind: 'monomorphic',
      step: 0,
      cooperationRate: 0,
      fractionGood: 1,
    })
  })

  it('appends one point per step using the latest stats snapshot', () => {
    const initial = initializeSimulation(
      makeParams({
        seed: 11,
        numAgents: 30,
        initialReputationMode: 'random',
      }),
    )
    const firstPoint = toTimeSeriesPoint(computeStats(initial))
    const { nextState } = stepSimulation(initial)
    const latestStats = computeStats(nextState)

    const history = appendTimeSeriesPoint([firstPoint], toTimeSeriesPoint(latestStats), 500)

    expect(history).toHaveLength(2)
    expect(history.at(-1)).toEqual({
      kind: 'monomorphic',
      step: latestStats.step,
      ...(latestStats.kind === 'monomorphic'
        ? {
            cooperationRate: latestStats.cooperationRate,
            fractionGood: latestStats.fractionGood,
          }
        : {}),
    })
  })

  it('keeps only the most recent 500 points', () => {
    let history: TimeSeriesPoint[] = [toTimeSeriesPoint(computeStats(initializeSimulation(makeParams())))]

    for (let step = 1; step <= 500; step += 1) {
      history = appendTimeSeriesPoint(
        history,
        {
          kind: 'monomorphic',
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
    const recentActions = Array.from({ length: ROLLING_WINDOW_SIZE }, (_, index) => (index < 40 ? 'C' : 'D')) as (
      | 'C'
      | 'D'
    )[]

    const stats = computeStats({
      ...initial,
      interactionCount: 900,
      cooperationCount: 700,
      recentActions,
    })

    expect(stats.kind).toBe('monomorphic')
    if (stats.kind !== 'monomorphic') {
      throw new Error('Expected monomorphic stats')
    }
    expect(stats.cooperationRate).toBe(40 / ROLLING_WINDOW_SIZE)
  })

  it('retains only the most recent 100 realized actions in state', () => {
    let state = initializeSimulation(
      makeParams({
        socialNormId: 'image-scoring',
        actionErrorProbability: 0,
        observationProbability: 0,
      }),
    )

    for (let index = 0; index < ROLLING_WINDOW_SIZE + 25; index += 1) {
      state = stepSimulation(state).nextState
    }

    expect(state.recentActions).toHaveLength(ROLLING_WINDOW_SIZE)
  })
})

describe('polymorphic payoff stats', () => {
  it('records donor and recipient cooperation counts for cooperative and defective interactions', () => {
    const cooperativeState = initializeSimulation(
      makeParams({
        numAgents: 30,
        populationMode: 'polymorphic',
        socialNormId: 'shunning',
        seed: 10752,
        actionErrorProbability: 0,
        observationProbability: 0,
      }),
    )
    const cooperativeResult = stepSimulation(cooperativeState)

    expect(cooperativeResult.event.realizedAction).toBe('C')
    expect(cooperativeResult.nextState.recentInteractionSummaries).toHaveLength(1)
    expect(cooperativeResult.nextState.recentInteractionSummaries[0]).toEqual({
      donorSelections: {
        focal: 0,
        alld: 0,
        allc: 1,
      },
      donorCooperations: {
        focal: 0,
        alld: 0,
        allc: 1,
      },
      recipientSelections: {
        focal: 1,
        alld: 0,
        allc: 0,
      },
      recipientCooperations: {
        focal: 1,
        alld: 0,
        allc: 0,
      },
    })

    const defectiveState = initializeSimulation(
      makeParams({
        numAgents: 30,
        populationMode: 'polymorphic',
        socialNormId: 'image-scoring',
        seed: 8222,
        actionErrorProbability: 0,
        observationProbability: 0,
      }),
    )
    const defectiveResult = stepSimulation(defectiveState)

    expect(defectiveResult.event.realizedAction).toBe('D')
    expect(defectiveResult.nextState.recentInteractionSummaries[0]).toEqual({
      donorSelections: {
        focal: 0,
        alld: 1,
        allc: 0,
      },
      donorCooperations: {
        focal: 0,
        alld: 0,
        allc: 0,
      },
      recipientSelections: {
        focal: 0,
        alld: 1,
        allc: 0,
      },
      recipientCooperations: {
        focal: 0,
        alld: 0,
        allc: 0,
      },
    })
  })

  it('computes payoff from recipient and donor cooperation probabilities', () => {
    const initial = initializeSimulation(makeParams({ numAgents: 30, populationMode: 'polymorphic' }))
    const stats = computeStats({
      ...initial,
      step: 2,
      interactionCount: 2,
      recentInteractionSummaries: [
        {
          donorSelections: { focal: 2, alld: 0, allc: 0 },
          donorCooperations: { focal: 2, alld: 0, allc: 0 },
          recipientSelections: { focal: 4, alld: 0, allc: 0 },
          recipientCooperations: { focal: 4, alld: 0, allc: 0 },
        },
        {
          donorSelections: { focal: 0, alld: 1, allc: 1 },
          donorCooperations: { focal: 0, alld: 1, allc: 1 },
          recipientSelections: { focal: 0, alld: 2, allc: 2 },
          recipientCooperations: { focal: 0, alld: 2, allc: 2 },
        },
      ],
    })

    expect(stats).toEqual({
      kind: 'polymorphic',
      step: 2,
      focalPayoff: 4,
      alldPayoff: 4,
      allcPayoff: 4,
      interactionCount: 2,
    })
    expect(toTimeSeriesPoint(stats)).toEqual({
      kind: 'polymorphic',
      step: 2,
      focalPayoff: 4,
      alldPayoff: 4,
      allcPayoff: 4,
    })
  })

  it('retains only the most recent 100 interaction summaries in state', () => {
    let state = initializeSimulation(
      makeParams({
        numAgents: 30,
        populationMode: 'polymorphic',
        socialNormId: 'shunning',
        actionErrorProbability: 0,
        observationProbability: 0,
      }),
    )

    for (let index = 0; index < ROLLING_WINDOW_SIZE + 25; index += 1) {
      state = stepSimulation(state).nextState
    }

    expect(state.recentInteractionSummaries).toHaveLength(ROLLING_WINDOW_SIZE)
  })
})

describe('polymorphic population', () => {
  it('builds deterministic thirds for each allowed population size', () => {
    expect(buildAgentStrategies(30, 'polymorphic')).toEqual([
      ...Array(10).fill('focal'),
      ...Array(10).fill('alld'),
      ...Array(10).fill('allc'),
    ])
    expect(buildAgentStrategies(60, 'polymorphic')).toEqual([
      ...Array(20).fill('focal'),
      ...Array(20).fill('alld'),
      ...Array(20).fill('allc'),
    ])
    expect(buildAgentStrategies(150, 'polymorphic')).toEqual([
      ...Array(50).fill('focal'),
      ...Array(50).fill('alld'),
      ...Array(50).fill('allc'),
    ])
  })

  it('stores the deterministic strategy assignment in simulation state', () => {
    const initialA = initializeSimulation(makeParams({ numAgents: 60, populationMode: 'polymorphic' }))
    const initialB = initializeSimulation(makeParams({ numAgents: 60, populationMode: 'polymorphic' }))

    expect(initialA.agentStrategies).toEqual(buildAgentStrategies(60, 'polymorphic'))
    expect(initialA.agentStrategies).toEqual(initialB.agentStrategies)
  })

  it('makes ALLD donors always intend D', () => {
    const probe = findSeedForDonorStrategy('alld', {
      numAgents: 30,
      populationMode: 'polymorphic',
      socialNormId: 'image-scoring',
      actionErrorProbability: 0,
      observationProbability: 0,
    })
    const params = makeParams({
      numAgents: 30,
      populationMode: 'polymorphic',
      socialNormId: 'image-scoring',
      seed: probe.seed,
      actionErrorProbability: 0,
      observationProbability: 0,
    })

    const state = initializeSimulation(params)

    const { event } = stepSimulation(state)

    expect(event.donor).toBe(probe.donor)
    expect(state.agentStrategies[event.donor]).toBe('alld')
    expect(event.intendedAction).toBe('D')
  })

  it('makes ALLC donors always intend C', () => {
    const probe = findSeedForDonorStrategy('allc', {
      numAgents: 30,
      populationMode: 'polymorphic',
      socialNormId: 'shunning',
      actionErrorProbability: 0,
      observationProbability: 0,
    })
    const params = makeParams({
      numAgents: 30,
      populationMode: 'polymorphic',
      socialNormId: 'shunning',
      seed: probe.seed,
      actionErrorProbability: 0,
      observationProbability: 0,
    })

    const state = initializeSimulation(params)

    const { event } = stepSimulation(state)

    expect(event.donor).toBe(probe.donor)
    expect(state.agentStrategies[event.donor]).toBe('allc')
    expect(event.intendedAction).toBe('C')
  })

  it('keeps focal donors on the selected focal norm action rule', () => {
    const probe = findSeedForDonorStrategy('focal', {
      numAgents: 30,
      populationMode: 'polymorphic',
      socialNormId: 'leading-eight-l1',
      actionErrorProbability: 0,
      observationProbability: 0,
    })
    const params = makeParams({
      numAgents: 30,
      populationMode: 'polymorphic',
      socialNormId: 'leading-eight-l1',
      seed: probe.seed,
      actionErrorProbability: 0,
      observationProbability: 0,
    })

    const state = initializeSimulation(params)
    state.imageMatrix[probe.donor][probe.donor] = 'B'
    state.imageMatrix[probe.donor][probe.recipient] = 'B'

    const { event } = stepSimulation(state)

    expect(event.donor).toBe(probe.donor)
    expect(state.agentStrategies[event.donor]).toBe('focal')
    expect(event.intendedAction).toBe('C')
  })

  it('makes ALLD observers always assign B', () => {
    const params = makeParams({
      numAgents: 30,
      populationMode: 'polymorphic',
      socialNormId: 'image-scoring',
      seed: 0,
      actionErrorProbability: 0,
      observationProbability: 1,
      assessmentErrorProbability: 0,
    })

    const state = initializeSimulation(params)
    state.rngState = 0
    state.imageMatrix = Array.from({ length: params.numAgents }, () =>
      Array.from({ length: params.numAgents }, () => 'G' as Reputation),
    )

    const { nextState, event } = stepSimulation(state)
    const alldObserver = 10

    expect(state.agentStrategies[alldObserver]).toBe('alld')
    expect(event.observingAgents).toContain(alldObserver)
    expect(nextState.imageMatrix[alldObserver][event.donor]).toBe('B')
  })

  it('makes ALLC observers always assign G', () => {
    const params = makeParams({
      numAgents: 30,
      populationMode: 'polymorphic',
      socialNormId: 'image-scoring',
      seed: 0,
      actionErrorProbability: 0,
      observationProbability: 1,
      assessmentErrorProbability: 0,
    })

    const state = initializeSimulation(params)
    state.rngState = 10
    state.imageMatrix = Array.from({ length: params.numAgents }, () =>
      Array.from({ length: params.numAgents }, () => 'B' as Reputation),
    )

    const { nextState, event } = stepSimulation(state)
    const allcObserver = 20

    expect(state.agentStrategies[allcObserver]).toBe('allc')
    expect(event.observingAgents).toContain(allcObserver)
    expect(nextState.imageMatrix[allcObserver][event.donor]).toBe('G')
  })

  it('still applies action error to ALLC and ALLD donors', () => {
    const allcProbe = findSeedForDonorStrategy('allc', {
      numAgents: 30,
      populationMode: 'polymorphic',
      actionErrorProbability: 1,
      observationProbability: 0,
    })
    const allcState = initializeSimulation(
      makeParams({
        numAgents: 30,
        populationMode: 'polymorphic',
        seed: allcProbe.seed,
        actionErrorProbability: 1,
        observationProbability: 0,
      }),
    )

    const alldProbe = findSeedForDonorStrategy('alld', {
      numAgents: 30,
      populationMode: 'polymorphic',
      actionErrorProbability: 1,
      observationProbability: 0,
    })
    const alldState = initializeSimulation(
      makeParams({
        numAgents: 30,
        populationMode: 'polymorphic',
        seed: alldProbe.seed,
        actionErrorProbability: 1,
        observationProbability: 0,
      }),
    )

    expect(stepSimulation(allcState).event).toMatchObject({
      donor: allcProbe.donor,
      intendedAction: 'C',
      realizedAction: 'D',
    })
    expect(stepSimulation(alldState).event).toMatchObject({
      donor: alldProbe.donor,
      intendedAction: 'D',
      realizedAction: 'C',
    })
  })

  it('still applies assessment error after fixed observer rules', () => {
    const alldState = initializeSimulation(
      makeParams({
        numAgents: 30,
        populationMode: 'polymorphic',
        seed: 0,
        actionErrorProbability: 0,
        observationProbability: 1,
        assessmentErrorProbability: 1,
      }),
    )
    alldState.rngState = 0
    alldState.imageMatrix = Array.from({ length: alldState.params.numAgents }, () =>
      Array.from({ length: alldState.params.numAgents }, () => 'G' as Reputation),
    )

    const allcState = initializeSimulation(
      makeParams({
        numAgents: 30,
        populationMode: 'polymorphic',
        seed: 0,
        actionErrorProbability: 0,
        observationProbability: 1,
        assessmentErrorProbability: 1,
      }),
    )
    allcState.rngState = 10
    allcState.imageMatrix = Array.from({ length: allcState.params.numAgents }, () =>
      Array.from({ length: allcState.params.numAgents }, () => 'B' as Reputation),
    )

    const alldResult = stepSimulation(alldState)
    const allcResult = stepSimulation(allcState)

    expect(alldResult.nextState.imageMatrix[10][alldResult.event.donor]).toBe('G')
    expect(allcResult.nextState.imageMatrix[20][allcResult.event.donor]).toBe('B')
  })
})

describe('monomorphic population', () => {
  it('assigns all agents to the focal strategy', () => {
    expect(buildAgentStrategies(30, 'monomorphic')).toEqual(Array(30).fill('focal'))
    expect(buildAgentStrategies(60, 'monomorphic')).toEqual(Array(60).fill('focal'))
    expect(buildAgentStrategies(150, 'monomorphic')).toEqual(Array(150).fill('focal'))
  })

  it('stores a homogeneous focal population in simulation state', () => {
    const initial = initializeSimulation(makeParams({ numAgents: 60, populationMode: 'monomorphic' }))

    expect(initial.agentStrategies).toEqual(buildAgentStrategies(60, 'monomorphic'))
    expect(new Set(initial.agentStrategies)).toEqual(new Set(['focal']))
  })

  it('keeps all observers on the selected focal norm', () => {
    const params = makeParams({
      numAgents: 30,
      populationMode: 'monomorphic',
      socialNormId: 'image-scoring',
      seed: 0,
      actionErrorProbability: 0,
      observationProbability: 1,
      assessmentErrorProbability: 0,
    })

    const state = initializeSimulation(params)
    state.imageMatrix = Array.from({ length: params.numAgents }, () =>
      Array.from({ length: params.numAgents }, () => 'B' as Reputation),
    )

    const { nextState, event } = stepSimulation(state)

    for (const observer of event.observingAgents) {
      expect(state.agentStrategies[observer]).toBe('focal')
      expect(nextState.imageMatrix[observer][event.donor]).toBe(event.realizedAction === 'C' ? 'G' : 'B')
    }
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
  it('accepts only the supported fixed population sizes', () => {
    expect(validateParameters({ ...DEFAULT_PARAMETERS, numAgents: 30 }).numAgents).toBe(30)
    expect(validateParameters({ ...DEFAULT_PARAMETERS, numAgents: 60 }).numAgents).toBe(60)
    expect(validateParameters({ ...DEFAULT_PARAMETERS, numAgents: 150 }).numAgents).toBe(150)
    expect(() => validateParameters({ ...DEFAULT_PARAMETERS, numAgents: 12 as 30 })).toThrow(
      'numAgents must be one of 30, 60, 150.',
    )
    expect(() => validateParameters({ ...DEFAULT_PARAMETERS, numAgents: 90 as 30 })).toThrow(
      'numAgents must be one of 30, 60, 150.',
    )
    expect(() => validateParameters({ ...DEFAULT_PARAMETERS, numAgents: 151 as 30 })).toThrow(
      'numAgents must be one of 30, 60, 150.',
    )
  })

  it('accepts only supported population modes', () => {
    expect(validateParameters({ ...DEFAULT_PARAMETERS, populationMode: 'monomorphic' }).populationMode).toBe('monomorphic')
    expect(validateParameters({ ...DEFAULT_PARAMETERS, populationMode: 'polymorphic' }).populationMode).toBe('polymorphic')
    expect(() => validateParameters({ ...DEFAULT_PARAMETERS, populationMode: 'mixed' as 'monomorphic' })).toThrow(
      'populationMode must be either "monomorphic" or "polymorphic".',
    )
  })

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
