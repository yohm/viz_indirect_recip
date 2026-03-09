import { ACTION_RULE_PRESETS, createActionRuleFromTable, type ActionRuleDefinition } from './actionRules'
import { createNormFromTable, NORM_PRESETS, type NormDefinition } from './norms'
import { SOCIAL_NORM_PRESETS } from './socialNormPresets'
import { ACTION_TABLE_KEYS, ASSESSMENT_TABLE_KEYS, type CustomSocialNormDefinition } from './types'

export interface SocialNormListItem {
  id: string
  name: string
  description: string
  source: 'preset' | 'custom'
}

export interface ResolvedSocialNorm {
  id: string
  name: string
  description: string
  assessmentRule: NormDefinition
  actionRule: ActionRuleDefinition
  source: 'preset' | 'custom'
}

function cloneCustomSocialNorm(norm: CustomSocialNormDefinition): CustomSocialNormDefinition {
  return {
    ...norm,
    assessmentRule: {
      ...norm.assessmentRule,
      table: { ...norm.assessmentRule.table },
    },
    actionRule: {
      ...norm.actionRule,
      table: { ...norm.actionRule.table },
    },
  }
}

export function listAvailableSocialNorms(customNorms: CustomSocialNormDefinition[]): SocialNormListItem[] {
  return [
    ...SOCIAL_NORM_PRESETS.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      source: 'preset' as const,
    })),
    ...customNorms.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      source: 'custom' as const,
    })),
  ]
}

export function validateCustomSocialNorm(norm: CustomSocialNormDefinition): void {
  if (!norm.id.trim()) {
    throw new Error('Custom social norm id must not be empty.')
  }
  if (!norm.name.trim()) {
    throw new Error('Custom social norm name must not be empty.')
  }
  if (!norm.assessmentRule.id.trim()) {
    throw new Error(`Custom social norm "${norm.name}" must have an assessment rule id.`)
  }
  if (!norm.actionRule.id.trim()) {
    throw new Error(`Custom social norm "${norm.name}" must have an action rule id.`)
  }
  if (SOCIAL_NORM_PRESETS.some((item) => item.id === norm.id)) {
    throw new Error(`Custom social norm id conflicts with a built-in preset: ${norm.id}`)
  }

  for (const key of ASSESSMENT_TABLE_KEYS) {
    const value = norm.assessmentRule.table[key]
    if (value !== 'G' && value !== 'B') {
      throw new Error(`Custom social norm "${norm.name}" has an invalid assessment table value for ${key}.`)
    }
  }

  for (const key of ACTION_TABLE_KEYS) {
    const value = norm.actionRule.table[key]
    if (value !== 'C' && value !== 'D') {
      throw new Error(`Custom social norm "${norm.name}" has an invalid action table value for ${key}.`)
    }
  }
}

export function validateCustomSocialNormCollection(customNorms: CustomSocialNormDefinition[]): void {
  const ids = new Set<string>()
  for (const norm of customNorms) {
    validateCustomSocialNorm(norm)
    if (ids.has(norm.id)) {
      throw new Error(`Duplicate custom social norm id: ${norm.id}`)
    }
    ids.add(norm.id)
  }
}

export function resolveSocialNorm(
  socialNormId: string,
  customNorms: CustomSocialNormDefinition[] = [],
): ResolvedSocialNorm {
  const preset = SOCIAL_NORM_PRESETS.find((item) => item.id === socialNormId)
  if (preset) {
    const assessmentRule = NORM_PRESETS.find((item) => item.id === preset.assessmentRuleId)
    const actionRule = ACTION_RULE_PRESETS.find((item) => item.id === preset.actionRuleId)
    if (!assessmentRule || !actionRule) {
      throw new Error(`Social norm preset is not fully defined: ${socialNormId}`)
    }

    return {
      id: preset.id,
      name: preset.name,
      description: preset.description,
      assessmentRule,
      actionRule,
      source: 'preset',
    }
  }

  const custom = customNorms.find((item) => item.id === socialNormId)
  if (!custom) {
    throw new Error(`Unknown social norm id: ${socialNormId}`)
  }

  validateCustomSocialNorm(custom)

  return {
    id: custom.id,
    name: custom.name,
    description: custom.description,
    assessmentRule: createNormFromTable(
      custom.assessmentRule.id,
      custom.assessmentRule.name,
      custom.assessmentRule.description,
      custom.assessmentRule.table,
    ),
    actionRule: createActionRuleFromTable(
      custom.actionRule.id,
      custom.actionRule.name,
      custom.actionRule.description,
      custom.actionRule.table,
    ),
    source: 'custom',
  }
}

export function duplicatePresetAsCustom(
  socialNormId: string,
  customId: string,
  customName: string,
): CustomSocialNormDefinition {
  const preset = SOCIAL_NORM_PRESETS.find((item) => item.id === socialNormId)
  if (!preset) {
    throw new Error(`Unknown social norm id: ${socialNormId}`)
  }

  const assessmentPreset = NORM_PRESETS.find((item) => item.id === preset.assessmentRuleId)
  const actionPreset = ACTION_RULE_PRESETS.find((item) => item.id === preset.actionRuleId)
  if (!assessmentPreset || !actionPreset) {
    throw new Error(`Social norm preset is not fully defined: ${socialNormId}`)
  }

  const assessmentTable = assessmentPreset.table
  const actionTable = actionPreset.table

  if (!assessmentTable || !actionTable) {
    throw new Error(`Social norm preset cannot be duplicated because its tables are not available: ${socialNormId}`)
  }

  return cloneCustomSocialNorm({
    id: customId,
    name: customName,
    description: `Custom copy of ${preset.name}.`,
    assessmentRule: {
      id: `${customId}-assessment`,
      name: `${customName} Assessment`,
      description: assessmentPreset.description,
      table: assessmentTable,
    },
    actionRule: {
      id: `${customId}-action`,
      name: `${customName} Action`,
      description: actionPreset.description,
      table: actionTable,
    },
  })
}
