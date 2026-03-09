export type Reputation = 'G' | 'B'

export type Action = 'C' | 'D'

export type InitialReputationMode = 'all-good' | 'random'

export type AssessmentMode = 'private' | 'public'

export interface SimulationParameters {
  numAgents: number
  socialNormId: string
  assessmentMode: AssessmentMode
  observationProbability: number
  actionErrorProbability: number
  assessmentErrorProbability: number
  initialReputationMode: InitialReputationMode
  seed: number
  autoplayStepsPerSecond: number
  maxEventLogSize: number
}

export interface DonorDecisionContext {
  donor: number
  recipient: number
  donorViewOfSelf: Reputation
  donorViewOfRecipient: Reputation
}

export interface ReputationChange {
  observer: number
  donor: number
  previous: Reputation
  next: Reputation
}

export interface InteractionEvent {
  step: number
  donor: number
  recipient: number
  assessor: number | null
  intendedAction: Action
  realizedAction: Action
  observingAgents: number[]
  reputationChanges: ReputationChange[]
}

export interface SimulationStats {
  step: number
  cooperationRate: number
  fractionGood: number
  interactionCount: number
  cooperationCount: number
}

export interface TimeSeriesPoint {
  step: number
  cooperationRate: number
  fractionGood: number
}

export interface SimulationState {
  params: SimulationParameters
  imageMatrix: Reputation[][]
  step: number
  interactionCount: number
  cooperationCount: number
  recentActions: Action[]
  rngState: number
  events: InteractionEvent[]
}
