import { getActionRuleById } from './actionRules'
import { getNormById } from './norms'
import type { SimulationParameters, SimulationState } from './types'

const DEFAULT_MAX_EVENT_LOG_SIZE = 200

export const DEFAULT_PARAMETERS: SimulationParameters = {
  numAgents: 30,
  normId: 'stern-judging',
  actionRuleId: 'recipient-discriminator',
  observationProbability: 0.7,
  actionErrorProbability: 0.02,
  assessmentErrorProbability: 0.02,
  initialReputationMode: 'all-good',
  seed: 42,
  autoplayStepsPerSecond: 10,
  maxEventLogSize: DEFAULT_MAX_EVENT_LOG_SIZE,
}

export function validateParameters(input: SimulationParameters): SimulationParameters {
  const params = { ...input }

  if (!Number.isInteger(params.numAgents) || params.numAgents < 2 || params.numAgents > 500) {
    throw new Error('numAgents must be an integer between 2 and 500.')
  }
  if (params.observationProbability < 0 || params.observationProbability > 1) {
    throw new Error('observationProbability must be within [0, 1].')
  }
  if (params.actionErrorProbability < 0 || params.actionErrorProbability > 1) {
    throw new Error('actionErrorProbability must be within [0, 1].')
  }
  if (params.assessmentErrorProbability < 0 || params.assessmentErrorProbability > 1) {
    throw new Error('assessmentErrorProbability must be within [0, 1].')
  }
  if (!Number.isFinite(params.seed)) {
    throw new Error('seed must be a finite number.')
  }
  if (params.autoplayStepsPerSecond <= 0 || params.autoplayStepsPerSecond > 120) {
    throw new Error('autoplayStepsPerSecond must be in (0, 120].')
  }
  if (!Number.isInteger(params.maxEventLogSize) || params.maxEventLogSize < 1 || params.maxEventLogSize > 5000) {
    throw new Error('maxEventLogSize must be an integer between 1 and 5000.')
  }

  getNormById(params.normId)
  getActionRuleById(params.actionRuleId)

  params.seed = params.seed >>> 0
  return params
}

export function cloneState(state: SimulationState): SimulationState {
  return {
    ...state,
    params: { ...state.params },
    imageMatrix: state.imageMatrix.map((row) => [...row]),
    events: state.events.map((event) => ({
      ...event,
      observingAgents: [...event.observingAgents],
      reputationChanges: event.reputationChanges.map((change) => ({ ...change })),
    })),
  }
}
