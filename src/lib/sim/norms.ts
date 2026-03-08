import type { Action, Reputation } from './types'

export interface NormAssessmentContext {
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
  table: Record<`${Reputation}-${Action}`, Reputation>,
): NormDefinition {
  return {
    id,
    name,
    description,
    assessDonor(context) {
      return table[`${context.observerViewOfRecipient}-${context.realizedAction}`]
    },
  }
}

const IMAGE_SCORING = createBinaryNorm(
  'image-scoring',
  'Image Scoring',
  'Cooperation is assessed Good, defection Bad, independent of recipient reputation.',
  {
    'G-C': 'G',
    'G-D': 'B',
    'B-C': 'G',
    'B-D': 'B',
  },
)

const SIMPLE_STANDING = createBinaryNorm(
  'simple-standing',
  'Simple Standing',
  'Defection against Good is Bad, defection against Bad is Good; cooperation is Good.',
  {
    'G-C': 'G',
    'G-D': 'B',
    'B-C': 'G',
    'B-D': 'G',
  },
)

const STERN_JUDGING = createBinaryNorm(
  'stern-judging',
  'Stern Judging',
  'Cooperate with Good and defect against Bad are Good; opposite pairings are Bad.',
  {
    'G-C': 'G',
    'G-D': 'B',
    'B-C': 'B',
    'B-D': 'G',
  },
)

export const NORM_PRESETS: NormDefinition[] = [IMAGE_SCORING, SIMPLE_STANDING, STERN_JUDGING]

export function getNormById(normId: string): NormDefinition {
  const norm = NORM_PRESETS.find((item) => item.id === normId)
  if (!norm) {
    throw new Error(`Unknown norm id: ${normId}`)
  }
  return norm
}
