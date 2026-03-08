export interface SocialNormDefinition {
  id: string
  name: string
  description: string
  assessmentRuleId: string
  actionRuleId: string
}

export const SOCIAL_NORM_PRESETS: SocialNormDefinition[] = [
  {
    id: 'image-scoring',
    name: 'Image Scoring',
    description: 'Image scoring assessment with recipient discriminator action rule.',
    assessmentRuleId: 'image-scoring',
    actionRuleId: 'recipient-discriminator',
  },
  {
    id: 'simple-standing',
    name: 'Simple Standing',
    description: 'Simple standing assessment with recipient discriminator action rule.',
    assessmentRuleId: 'simple-standing',
    actionRuleId: 'recipient-discriminator',
  },
  {
    id: 'stern-judging',
    name: 'Stern Judging',
    description: 'Stern judging assessment with recipient discriminator action rule.',
    assessmentRuleId: 'stern-judging',
    actionRuleId: 'recipient-discriminator',
  },
  {
    id: 'contrite-judging',
    name: 'Contrite Judging',
    description: 'Contrite judging assessment with recipient discriminator action rule.',
    assessmentRuleId: 'contrite-judging',
    actionRuleId: 'recipient-discriminator',
  },
  {
    id: 'self-conscious',
    name: 'Self Conscious (Action Rule Variant)',
    description: 'Stern judging assessment with self-conscious donor action rule.',
    assessmentRuleId: 'stern-judging',
    actionRuleId: 'self-conscious',
  },
  {
    id: 'self-confident',
    name: 'Self Confident (Action Rule Variant)',
    description: 'Stern judging assessment with self-confident donor action rule.',
    assessmentRuleId: 'stern-judging',
    actionRuleId: 'self-confident',
  },
  {
    id: 'leading-eight-l1',
    name: 'Leading Eight L1',
    description: 'Published L1 combination of action and assessment rules.',
    assessmentRuleId: 'leading-eight-l1',
    actionRuleId: 'leading-eight-l1-l2',
  },
  {
    id: 'leading-eight-l2',
    name: 'Leading Eight L2 (Standing)',
    description: 'Published L2/standing combination.',
    assessmentRuleId: 'leading-eight-l2',
    actionRuleId: 'leading-eight-l1-l2',
  },
  {
    id: 'leading-eight-l3',
    name: 'Leading Eight L3 (Simple Standing)',
    description: 'Published L3/simple standing combination.',
    assessmentRuleId: 'leading-eight-l3',
    actionRuleId: 'leading-eight-l3-l8',
  },
  {
    id: 'leading-eight-l4',
    name: 'Leading Eight L4',
    description: 'Published L4 combination.',
    assessmentRuleId: 'leading-eight-l4',
    actionRuleId: 'leading-eight-l3-l8',
  },
  {
    id: 'leading-eight-l5',
    name: 'Leading Eight L5',
    description: 'Published L5 combination.',
    assessmentRuleId: 'leading-eight-l5',
    actionRuleId: 'leading-eight-l3-l8',
  },
  {
    id: 'leading-eight-l6',
    name: 'Leading Eight L6 (Stern Judging)',
    description: 'Published L6/stern judging combination.',
    assessmentRuleId: 'leading-eight-l6',
    actionRuleId: 'leading-eight-l3-l8',
  },
  {
    id: 'leading-eight-l7',
    name: 'Leading Eight L7',
    description: 'Published L7 combination.',
    assessmentRuleId: 'leading-eight-l7',
    actionRuleId: 'leading-eight-l3-l8',
  },
  {
    id: 'leading-eight-l8',
    name: 'Leading Eight L8 (Judging)',
    description: 'Published L8/judging combination.',
    assessmentRuleId: 'leading-eight-l8',
    actionRuleId: 'leading-eight-l3-l8',
  },
]

export function getSocialNormById(socialNormId: string): SocialNormDefinition {
  const norm = SOCIAL_NORM_PRESETS.find((item) => item.id === socialNormId)
  if (!norm) {
    throw new Error(`Unknown social norm id: ${socialNormId}`)
  }
  return norm
}

export function findSocialNormIdByPair(assessmentRuleId: string, actionRuleId: string): string | null {
  const match = SOCIAL_NORM_PRESETS.find(
    (item) => item.assessmentRuleId === assessmentRuleId && item.actionRuleId === actionRuleId,
  )
  return match?.id ?? null
}
