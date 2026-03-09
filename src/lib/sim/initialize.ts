import { createRng } from './rng'
import type { Reputation, SimulationParameters, SimulationState } from './types'

function createMatrix(numAgents: number, fill: Reputation): Reputation[][] {
  return Array.from({ length: numAgents }, () => Array.from({ length: numAgents }, () => fill))
}

function createRandomMatrix(numAgents: number, seed: number): Reputation[][] {
  const rng = createRng(seed)
  return Array.from({ length: numAgents }, () =>
    Array.from({ length: numAgents }, () => (rng.nextBool(0.5) ? 'G' : 'B')),
  )
}

export function initializeImageMatrix(params: SimulationParameters): Reputation[][] {
  if (params.initialReputationMode === 'all-good') {
    return createMatrix(params.numAgents, 'G')
  }
  return createRandomMatrix(params.numAgents, params.seed)
}

export function initializeSimulation(params: SimulationParameters): SimulationState {
  return {
    params,
    imageMatrix: initializeImageMatrix(params),
    step: 0,
    interactionCount: 0,
    cooperationCount: 0,
    recentActions: [],
    rngState: params.seed >>> 0,
    events: [],
  }
}
