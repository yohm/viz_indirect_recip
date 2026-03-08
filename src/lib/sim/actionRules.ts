import type { Action, DonorDecisionContext, Reputation } from './types'

export interface ActionRuleDefinition {
  id: string
  name: string
  description: string
  decide(context: DonorDecisionContext): Action
}

function createActionRule(
  id: string,
  name: string,
  description: string,
  table: Record<`${Reputation}-${Reputation}`, Action>,
): ActionRuleDefinition {
  return {
    id,
    name,
    description,
    decide(context) {
      return table[`${context.donorViewOfSelf}-${context.donorViewOfRecipient}`]
    },
  }
}

const RECIPIENT_DISCRIMINATOR = createActionRule(
  'recipient-discriminator',
  'Recipient Discriminator',
  'Cooperate with recipients seen as Good; defect against recipients seen as Bad.',
  {
    'G-G': 'C',
    'G-B': 'D',
    'B-G': 'C',
    'B-B': 'D',
  },
)

const SELF_CONSCIOUS = createActionRule(
  'self-conscious',
  'Self Conscious',
  'When self-image is Bad, defect regardless of recipient; otherwise discriminate by recipient.',
  {
    'G-G': 'C',
    'G-B': 'D',
    'B-G': 'D',
    'B-B': 'D',
  },
)

const SELF_CONFIDENT = createActionRule(
  'self-confident',
  'Self Confident',
  'When self-image is Good, cooperate regardless of recipient; when Bad, defect.',
  {
    'G-G': 'C',
    'G-B': 'C',
    'B-G': 'D',
    'B-B': 'D',
  },
)

export const ACTION_RULE_PRESETS: ActionRuleDefinition[] = [
  RECIPIENT_DISCRIMINATOR,
  SELF_CONSCIOUS,
  SELF_CONFIDENT,
]

export function getActionRuleById(actionRuleId: string): ActionRuleDefinition {
  const rule = ACTION_RULE_PRESETS.find((item) => item.id === actionRuleId)
  if (!rule) {
    throw new Error(`Unknown action rule id: ${actionRuleId}`)
  }
  return rule
}
