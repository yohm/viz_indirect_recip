import { appendEvent } from './events'
import { createRng } from './rng'
import { resolveSocialNorm } from './socialNormCatalog'
import { COOPERATION_RATE_WINDOW } from './stats'
import type { Action, CustomNormCode, InteractionEvent, ReputationChange, SimulationState } from './types'

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

function appendRecentAction(actions: Action[], action: Action): Action[] {
  const nextActions = [...actions, action]
  if (nextActions.length <= COOPERATION_RATE_WINDOW) {
    return nextActions
  }
  return nextActions.slice(nextActions.length - COOPERATION_RATE_WINDOW)
}

export interface StepResult {
  nextState: SimulationState
  event: InteractionEvent
}

export function stepSimulation(state: SimulationState, customNorms: CustomNormCode[] = []): StepResult {
  const rng = createRng(state.rngState)
  const socialNorm = resolveSocialNorm(state.params.socialNormId, customNorms)
  const norm = socialNorm.assessmentRule
  const actionRule = socialNorm.actionRule
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
  let assessor: number | null = null

  if (state.params.assessmentMode === 'public') {
    if (rng.nextBool(state.params.observationProbability)) {
      assessor = 0
      observingAgents.push(0)

      let donorAssessment = norm.assessDonor({
        observerViewOfDonor: nextMatrix[0][donor],
        observerViewOfRecipient: nextMatrix[0][recipient],
        realizedAction,
      })

      if (rng.nextBool(state.params.assessmentErrorProbability)) {
        donorAssessment = flipReputation(donorAssessment)
      }

      for (let observer = 0; observer < numAgents; observer += 1) {
        const previous = nextMatrix[observer][donor]
        if (previous === donorAssessment) continue

        nextMatrix[observer][donor] = donorAssessment
        reputationChanges.push({
          observer,
          donor,
          previous,
          next: donorAssessment,
        })
      }
    }
  } else {
    for (let observer = 0; observer < numAgents; observer += 1) {
      if (!rng.nextBool(state.params.observationProbability)) continue

      observingAgents.push(observer)

      let donorAssessment = norm.assessDonor({
        observerViewOfDonor: nextMatrix[observer][donor],
        observerViewOfRecipient: nextMatrix[observer][recipient],
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
  }

  const event: InteractionEvent = {
    step: state.step + 1,
    donor,
    recipient,
    assessor,
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
    recentActions: appendRecentAction(state.recentActions, realizedAction),
    rngState: rng.getState(),
    events: appendEvent(state.events, event, state.params.maxEventLogSize),
  }

  return { nextState, event }
}
