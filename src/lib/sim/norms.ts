import type { Action, Reputation } from './types'

export interface NormAssessmentContext {
  observerViewOfDonor: Reputation
  observerViewOfRecipient: Reputation
  realizedAction: Action
}

export interface NormDefinition {
  id: string
  name: string
  description: string
  assessDonor(context: NormAssessmentContext): Reputation
}

function createBinaryNorm(
  id: string,
  name: string,
  description: string,
  table: Record<`${Reputation}-${Reputation}-${Action}`, Reputation>,
): NormDefinition {
  return {
    id,
    name,
    description,
    assessDonor(context) {
      return table[`${context.observerViewOfDonor}-${context.observerViewOfRecipient}-${context.realizedAction}`]
    },
  }
}

const IMAGE_SCORING = createBinaryNorm(
  'image-scoring',
  'Image Scoring',
  'Cooperation is Good and defection is Bad, independent of donor/recipient reputations.',
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

const SHUNNING = createBinaryNorm(
  'shunning',
  'Shunning',
  'Shunning third-order assessment rule.',
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

const LEADING_EIGHT_L1 = createBinaryNorm(
  'leading-eight-l1',
  'Leading Eight L1',
  'Assessment table from one of the eight cooperative third-order norms (L1).',
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

const LEADING_EIGHT_L2 = createBinaryNorm(
  'leading-eight-l2',
  'Leading Eight L2 (Standing)',
  'Assessment table for L2/standing.',
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

const LEADING_EIGHT_L3 = createBinaryNorm(
  'leading-eight-l3',
  'Leading Eight L3 (Simple Standing)',
  'Assessment table for L3/simple standing.',
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

const LEADING_EIGHT_L4 = createBinaryNorm(
  'leading-eight-l4',
  'Leading Eight L4',
  'Assessment table from one of the eight cooperative third-order norms (L4).',
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

const LEADING_EIGHT_L5 = createBinaryNorm(
  'leading-eight-l5',
  'Leading Eight L5',
  'Assessment table from one of the eight cooperative third-order norms (L5).',
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

const LEADING_EIGHT_L6 = createBinaryNorm(
  'leading-eight-l6',
  'Leading Eight L6 (Stern Judging)',
  'Assessment table for L6/stern judging.',
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

const LEADING_EIGHT_L7 = createBinaryNorm(
  'leading-eight-l7',
  'Leading Eight L7',
  'Assessment table from one of the eight cooperative third-order norms (L7).',
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

const LEADING_EIGHT_L8 = createBinaryNorm(
  'leading-eight-l8',
  'Leading Eight L8 (Judging)',
  'Assessment table for L8/judging.',
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
