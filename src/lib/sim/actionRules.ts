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

const DISCRIMINATOR = createActionRule(
  'discriminator',
  'Discriminator',
  'Cooperate with recipients seen as Good; defect against recipients seen as Bad.',
  {
    'G-G': 'C',
    'G-B': 'D',
    'B-G': 'C',
    'B-B': 'D',
  },
)

const LEADING_EIGHT_L1_L2 = createActionRule(
  'leading-eight-l1-l2',
  'Leading Eight L1/L2 Action',
  'Cooperate for (G,G), (B,G), and (B,B); defect for (G,B).',
  {
    'G-G': 'C',
    'G-B': 'D',
    'B-G': 'C',
    'B-B': 'C',
  },
)

export const ACTION_RULE_PRESETS: ActionRuleDefinition[] = [
  DISCRIMINATOR,
  LEADING_EIGHT_L1_L2,
]

export function getActionRuleById(actionRuleId: string): ActionRuleDefinition {
  const rule = ACTION_RULE_PRESETS.find((item) => item.id === actionRuleId)
  if (!rule) {
    throw new Error(`Unknown action rule id: ${actionRuleId}`)
  }
  return rule
}
