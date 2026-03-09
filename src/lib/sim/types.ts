export type Reputation = 'G' | 'B'

export type Action = 'C' | 'D'

export type AssessmentTableKey =
  | 'G-G-C'
  | 'G-G-D'
  | 'G-B-C'
  | 'G-B-D'
  | 'B-G-C'
  | 'B-G-D'
  | 'B-B-C'
  | 'B-B-D'

export type ActionTableKey = 'G-G' | 'G-B' | 'B-G' | 'B-B'

export type AssessmentTable = Record<AssessmentTableKey, Reputation>

export type ActionTable = Record<ActionTableKey, Action>

export const ASSESSMENT_TABLE_KEYS: AssessmentTableKey[] = [
  'G-G-C',
  'G-G-D',
  'G-B-C',
  'G-B-D',
  'B-G-C',
  'B-G-D',
  'B-B-C',
  'B-B-D',
]

export const ACTION_TABLE_KEYS: ActionTableKey[] = ['G-G', 'G-B', 'B-G', 'B-B']

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

export type CustomNormCode = string

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
