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

const SIMPLE_STANDING = createBinaryNorm(
  'simple-standing',
  'Simple Standing',
  'Defection against Good is Bad, defection against Bad is Good; cooperation is Good.',
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

const STERN_JUDGING = createBinaryNorm(
  'stern-judging',
  'Stern Judging',
  'Cooperate with Good and defect against Bad are Good; opposite pairings are Bad.',
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

const CONTRITE_JUDGING = createBinaryNorm(
  'contrite-judging',
  'Contrite Judging',
  'Observer is stricter on already-Bad donors in some contexts (example third-order table).',
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

export const NORM_PRESETS: NormDefinition[] = [IMAGE_SCORING, SIMPLE_STANDING, STERN_JUDGING, CONTRITE_JUDGING]

export function getNormById(normId: string): NormDefinition {
  const norm = NORM_PRESETS.find((item) => item.id === normId)
  if (!norm) {
    throw new Error(`Unknown norm id: ${normId}`)
  }
  return norm
}
