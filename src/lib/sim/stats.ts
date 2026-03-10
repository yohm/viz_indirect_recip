import type { GroupInteractionBuckets, GroupInteractionSummary, Reputation, SimulationState, SimulationStats, TimeSeriesPoint } from './types'

export const ROLLING_WINDOW_SIZE = 100
const COOPERATION_BENEFIT = 5
const COOPERATION_COST = 1

function countReputation(imageMatrix: Reputation[][], value: Reputation): number {
  let count = 0
  for (const row of imageMatrix) {
    for (const entry of row) {
      if (entry === value) count += 1
    }
  }
  return count
}

function sumBuckets(
  history: GroupInteractionSummary[],
  key: 'donorSelections' | 'donorCooperations' | 'recipientSelections' | 'recipientCooperations',
): GroupInteractionBuckets {
  return history.reduce(
    (totals, entry) => ({
      focal: totals.focal + entry[key].focal,
      alld: totals.alld + entry[key].alld,
      allc: totals.allc + entry[key].allc,
    }),
    { focal: 0, alld: 0, allc: 0 },
  )
}

export function computeStats(state: SimulationState): SimulationStats {
  if (state.params.populationMode === 'polymorphic') {
    const donorSelectionSums = sumBuckets(state.recentInteractionSummaries, 'donorSelections')
    const donorCooperationSums = sumBuckets(state.recentInteractionSummaries, 'donorCooperations')
    const recipientSelectionSums = sumBuckets(state.recentInteractionSummaries, 'recipientSelections')
    const recipientCooperationSums = sumBuckets(state.recentInteractionSummaries, 'recipientCooperations')

    const averageFor = (group: keyof GroupInteractionBuckets): number => {
      const recipientProbability =
        recipientSelectionSums[group] === 0 ? 0 : recipientCooperationSums[group] / recipientSelectionSums[group]
      const donorProbability = donorSelectionSums[group] === 0 ? 0 : donorCooperationSums[group] / donorSelectionSums[group]
      return recipientProbability * COOPERATION_BENEFIT - donorProbability * COOPERATION_COST
    }

    return {
      kind: 'polymorphic',
      step: state.step,
      focalPayoff: averageFor('focal'),
      alldPayoff: averageFor('alld'),
      allcPayoff: averageFor('allc'),
      interactionCount: state.interactionCount,
    }
  }

  const totalCells = state.params.numAgents * state.params.numAgents
  const goodCount = countReputation(state.imageMatrix, 'G')
  const recentCooperationCount = state.recentActions.filter((action) => action === 'C').length

  return {
    kind: 'monomorphic',
    step: state.step,
    cooperationRate: state.recentActions.length === 0 ? 0 : recentCooperationCount / state.recentActions.length,
    fractionGood: totalCells === 0 ? 0 : goodCount / totalCells,
    interactionCount: state.interactionCount,
    cooperationCount: state.cooperationCount,
  }
}

export function toTimeSeriesPoint(stats: SimulationStats): TimeSeriesPoint {
  if (stats.kind === 'polymorphic') {
    return {
      kind: 'polymorphic',
      step: stats.step,
      focalPayoff: stats.focalPayoff,
      alldPayoff: stats.alldPayoff,
      allcPayoff: stats.allcPayoff,
    }
  }

  return {
    kind: 'monomorphic',
    step: stats.step,
    cooperationRate: stats.cooperationRate,
    fractionGood: stats.fractionGood,
  }
}

export function appendTimeSeriesPoint(
  history: TimeSeriesPoint[],
  point: TimeSeriesPoint,
  maxPoints: number,
): TimeSeriesPoint[] {
  if (maxPoints < 1) {
    throw new Error('maxPoints must be at least 1.')
  }

  const nextHistory = [...history, point]
  if (nextHistory.length <= maxPoints) {
    return nextHistory
  }

  return nextHistory.slice(nextHistory.length - maxPoints)
}
