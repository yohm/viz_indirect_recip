import type { Action, AssessmentTable, Reputation } from './types'

export interface NormAssessmentContext {
  observerViewOfDonor: Reputation
  observerViewOfRecipient: Reputation
  realizedAction: Action
}

export interface NormDefinition {
  id: string
  name: string
  table: AssessmentTable
  assessDonor(context: NormAssessmentContext): Reputation
}

export function createNormFromTable(
  id: string,
  name: string,
  table: AssessmentTable,
): NormDefinition {
  return {
    id,
    name,
    table,
    assessDonor(context) {
      return table[`${context.observerViewOfDonor}-${context.observerViewOfRecipient}-${context.realizedAction}`]
    },
  }
}

const IMAGE_SCORING = createNormFromTable(
  'image-scoring',
  'Image Scoring',
  {
    'G-G-C': 'G',
    'G-G-D': 'B',
    'G-B-C': 'G',
    'G-B-D': 'B',
    'B-G-C': 'G',
    'B-G-D': 'B',
    'B-B-C': 'G',
    'B-B-D': 'B',
  },
)

const SHUNNING = createNormFromTable(
  'shunning',
  'Shunning',
  {
    'G-G-C': 'G',
    'G-G-D': 'B',
    'G-B-C': 'B',
    'G-B-D': 'B',
    'B-G-C': 'G',
    'B-G-D': 'B',
    'B-B-C': 'B',
    'B-B-D': 'B',
  },
)

const LEADING_EIGHT_L1 = createNormFromTable(
  'leading-eight-l1',
  'Leading Eight L1',
  {
    'G-G-C': 'G',
    'G-G-D': 'B',
    'G-B-C': 'G',
    'G-B-D': 'G',
    'B-G-C': 'G',
    'B-G-D': 'B',
    'B-B-C': 'G',
    'B-B-D': 'B',
  },
)

const LEADING_EIGHT_L2 = createNormFromTable(
  'leading-eight-l2',
  'Leading Eight L2 (Standing)',
  {
    'G-G-C': 'G',
    'G-G-D': 'B',
    'G-B-C': 'B',
    'G-B-D': 'G',
    'B-G-C': 'G',
    'B-G-D': 'B',
    'B-B-C': 'G',
    'B-B-D': 'B',
  },
)

const LEADING_EIGHT_L3 = createNormFromTable(
  'leading-eight-l3',
  'Leading Eight L3 (Simple Standing)',
  {
    'G-G-C': 'G',
    'G-G-D': 'B',
    'G-B-C': 'G',
    'G-B-D': 'G',
    'B-G-C': 'G',
    'B-G-D': 'B',
    'B-B-C': 'G',
    'B-B-D': 'G',
  },
)

const LEADING_EIGHT_L4 = createNormFromTable(
  'leading-eight-l4',
  'Leading Eight L4',
  {
    'G-G-C': 'G',
    'G-G-D': 'B',
    'G-B-C': 'G',
    'G-B-D': 'G',
    'B-G-C': 'G',
    'B-G-D': 'B',
    'B-B-C': 'B',
    'B-B-D': 'G',
  },
)

const LEADING_EIGHT_L5 = createNormFromTable(
  'leading-eight-l5',
  'Leading Eight L5',
  {
    'G-G-C': 'G',
    'G-G-D': 'B',
    'G-B-C': 'B',
    'G-B-D': 'G',
    'B-G-C': 'G',
    'B-G-D': 'B',
    'B-B-C': 'G',
    'B-B-D': 'G',
  },
)

const LEADING_EIGHT_L6 = createNormFromTable(
  'leading-eight-l6',
  'Leading Eight L6 (Stern Judging)',
  {
    'G-G-C': 'G',
    'G-G-D': 'B',
    'G-B-C': 'B',
    'G-B-D': 'G',
    'B-G-C': 'G',
    'B-G-D': 'B',
    'B-B-C': 'B',
    'B-B-D': 'G',
  },
)

const LEADING_EIGHT_L7 = createNormFromTable(
  'leading-eight-l7',
  'Leading Eight L7',
  {
    'G-G-C': 'G',
    'G-G-D': 'B',
    'G-B-C': 'G',
    'G-B-D': 'G',
    'B-G-C': 'G',
    'B-G-D': 'B',
    'B-B-C': 'B',
    'B-B-D': 'B',
  },
)

const LEADING_EIGHT_L8 = createNormFromTable(
  'leading-eight-l8',
  'Leading Eight L8 (Judging)',
  {
    'G-G-C': 'G',
    'G-G-D': 'B',
    'G-B-C': 'B',
    'G-B-D': 'G',
    'B-G-C': 'G',
    'B-G-D': 'B',
    'B-B-C': 'B',
    'B-B-D': 'B',
  },
)

export const NORM_PRESETS: NormDefinition[] = [
  IMAGE_SCORING,
  SHUNNING,
  LEADING_EIGHT_L1,
  LEADING_EIGHT_L2,
  LEADING_EIGHT_L3,
  LEADING_EIGHT_L4,
  LEADING_EIGHT_L5,
  LEADING_EIGHT_L6,
  LEADING_EIGHT_L7,
  LEADING_EIGHT_L8,
]

export function getNormById(normId: string): NormDefinition {
  const norm = NORM_PRESETS.find((item) => item.id === normId)
  if (!norm) {
    throw new Error(`Unknown norm id: ${normId}`)
  }
  return norm
}
