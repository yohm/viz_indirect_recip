export interface SocialNormDefinition {
  id: string
  name: string
  assessmentRuleId: string
  actionRuleId: string
}

export const SOCIAL_NORM_PRESETS: SocialNormDefinition[] = [
  {
    id: 'image-scoring',
    name: 'Image Scoring',
    assessmentRuleId: 'image-scoring',
    actionRuleId: 'discriminator',
  },
  {
    id: 'shunning',
    name: 'Shunning',
    assessmentRuleId: 'shunning',
    actionRuleId: 'discriminator',
  },
  {
    id: 'leading-eight-l1',
    name: 'Leading Eight L1',
    assessmentRuleId: 'leading-eight-l1',
    actionRuleId: 'leading-eight-l1-l2',
  },
  {
    id: 'leading-eight-l2',
    name: 'Leading Eight L2 (Standing)',
    assessmentRuleId: 'leading-eight-l2',
    actionRuleId: 'leading-eight-l1-l2',
  },
  {
    id: 'leading-eight-l3',
    name: 'Leading Eight L3 (Simple Standing)',
    assessmentRuleId: 'leading-eight-l3',
    actionRuleId: 'discriminator',
  },
  {
    id: 'leading-eight-l4',
    name: 'Leading Eight L4',
    assessmentRuleId: 'leading-eight-l4',
    actionRuleId: 'discriminator',
  },
  {
    id: 'leading-eight-l5',
    name: 'Leading Eight L5',
    assessmentRuleId: 'leading-eight-l5',
    actionRuleId: 'discriminator',
  },
  {
    id: 'leading-eight-l6',
    name: 'Leading Eight L6 (Stern Judging)',
    assessmentRuleId: 'leading-eight-l6',
    actionRuleId: 'discriminator',
  },
  {
    id: 'leading-eight-l7',
    name: 'Leading Eight L7',
    assessmentRuleId: 'leading-eight-l7',
    actionRuleId: 'discriminator',
  },
  {
    id: 'leading-eight-l8',
    name: 'Leading Eight L8 (Judging)',
    assessmentRuleId: 'leading-eight-l8',
    actionRuleId: 'discriminator',
  },
]

export function getSocialNormById(socialNormId: string): SocialNormDefinition {
  const norm = SOCIAL_NORM_PRESETS.find((item) => item.id === socialNormId)
  if (!norm) {
    throw new Error(`Unknown social norm id: ${socialNormId}`)
  }
  return norm
}
