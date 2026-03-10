export type Reputation = 'G' | 'B'

export type Action = 'C' | 'D'

export const ALLOWED_NUM_AGENTS = [30, 60, 150] as const

export type AllowedNumAgents = (typeof ALLOWED_NUM_AGENTS)[number]

export type AgentStrategy = 'focal' | 'alld' | 'allc'

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

export type PopulationMode = 'monomorphic' | 'polymorphic'

export interface SimulationParameters {
  numAgents: AllowedNumAgents
  populationMode: PopulationMode
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

export interface GroupInteractionBuckets {
  focal: number
  alld: number
  allc: number
}

export interface GroupInteractionSummary {
  donorSelections: GroupInteractionBuckets
  donorCooperations: GroupInteractionBuckets
  recipientSelections: GroupInteractionBuckets
  recipientCooperations: GroupInteractionBuckets
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

export interface MonomorphicSimulationStats {
  kind: 'monomorphic'
  step: number
  cooperationRate: number
  fractionGood: number
  interactionCount: number
  cooperationCount: number
}

export interface PolymorphicSimulationStats {
  kind: 'polymorphic'
  step: number
  focalPayoff: number
  alldPayoff: number
  allcPayoff: number
  interactionCount: number
}

export type SimulationStats = MonomorphicSimulationStats | PolymorphicSimulationStats

export interface MonomorphicTimeSeriesPoint {
  kind: 'monomorphic'
  step: number
  cooperationRate: number
  fractionGood: number
}

export interface PolymorphicTimeSeriesPoint {
  kind: 'polymorphic'
  step: number
  focalPayoff: number
  alldPayoff: number
  allcPayoff: number
}

export type TimeSeriesPoint = MonomorphicTimeSeriesPoint | PolymorphicTimeSeriesPoint

export interface SimulationState {
  params: SimulationParameters
  agentStrategies: AgentStrategy[]
  imageMatrix: Reputation[][]
  step: number
  interactionCount: number
  cooperationCount: number
  recentActions: Action[]
  recentInteractionSummaries: GroupInteractionSummary[]
  rngState: number
  events: InteractionEvent[]
}
