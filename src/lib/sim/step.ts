import { getActionRuleById } from './actionRules'
import { appendEvent } from './events'
import { getNormById } from './norms'
import { createRng } from './rng'
import { getSocialNormById } from './socialNormPresets'
import type { Action, InteractionEvent, ReputationChange, SimulationState } from './types'

function chooseDistinctPair(numAgents: number, randomInt: (maxExclusive: number) => number): [number, number] {
  const donor = randomInt(numAgents)
  let recipient = randomInt(numAgents - 1)
  if (recipient >= donor) recipient += 1
  return [donor, recipient]
}

function flipAction(action: Action): Action {
  return action === 'C' ? 'D' : 'C'
}

function flipReputation(reputation: 'G' | 'B'): 'G' | 'B' {
  return reputation === 'G' ? 'B' : 'G'
}

export interface StepResult {
  nextState: SimulationState
  event: InteractionEvent
}

export function stepSimulation(state: SimulationState): StepResult {
  const rng = createRng(state.rngState)
  const socialNorm = getSocialNormById(state.params.socialNormId)
  const norm = getNormById(socialNorm.assessmentRuleId)
  const actionRule = getActionRuleById(socialNorm.actionRuleId)
  const numAgents = state.params.numAgents

  const [donor, recipient] = chooseDistinctPair(numAgents, (limit) => rng.nextInt(limit))

  const donorViewOfSelf = state.imageMatrix[donor][donor]
  const donorViewOfRecipient = state.imageMatrix[donor][recipient]
  const intendedAction = actionRule.decide({
    donor,
    recipient,
    donorViewOfSelf,
    donorViewOfRecipient,
  })

  const realizedAction = rng.nextBool(state.params.actionErrorProbability) ? flipAction(intendedAction) : intendedAction

  const nextMatrix = state.imageMatrix.map((row) => [...row])
  const observingAgents: number[] = []
  const reputationChanges: ReputationChange[] = []

  for (let observer = 0; observer < numAgents; observer += 1) {
    if (!rng.nextBool(state.params.observationProbability)) continue

    observingAgents.push(observer)

    const observerViewOfDonor = nextMatrix[observer][donor]
    const observerViewOfRecipient = nextMatrix[observer][recipient]
    let donorAssessment = norm.assessDonor({
      observerViewOfDonor,
      observerViewOfRecipient,
      realizedAction,
    })

    if (rng.nextBool(state.params.assessmentErrorProbability)) {
      donorAssessment = flipReputation(donorAssessment)
    }

    const previous = nextMatrix[observer][donor]
    if (previous !== donorAssessment) {
      nextMatrix[observer][donor] = donorAssessment
      reputationChanges.push({
        observer,
        donor,
        previous,
        next: donorAssessment,
      })
    }
  }

  const event: InteractionEvent = {
    step: state.step + 1,
    donor,
    recipient,
    intendedAction,
    realizedAction,
    observingAgents,
    reputationChanges,
  }

  const nextState: SimulationState = {
    ...state,
    imageMatrix: nextMatrix,
    step: state.step + 1,
    interactionCount: state.interactionCount + 1,
    cooperationCount: state.cooperationCount + (realizedAction === 'C' ? 1 : 0),
    rngState: rng.getState(),
    events: appendEvent(state.events, event, state.params.maxEventLogSize),
  }

  return { nextState, event }
}
