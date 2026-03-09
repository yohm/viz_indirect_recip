import type { Reputation, SimulationState, SimulationStats, TimeSeriesPoint } from './types'

function countReputation(imageMatrix: Reputation[][], value: Reputation): number {
  let count = 0
  for (const row of imageMatrix) {
    for (const entry of row) {
      if (entry === value) count += 1
    }
  }
  return count
}

export function computeStats(state: SimulationState): SimulationStats {
  const totalCells = state.params.numAgents * state.params.numAgents
  const goodCount = countReputation(state.imageMatrix, 'G')

  return {
    step: state.step,
    cooperationRate: state.interactionCount === 0 ? 0 : state.cooperationCount / state.interactionCount,
    fractionGood: totalCells === 0 ? 0 : goodCount / totalCells,
    interactionCount: state.interactionCount,
    cooperationCount: state.cooperationCount,
  }
}

export function toTimeSeriesPoint(stats: SimulationStats): TimeSeriesPoint {
  return {
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
