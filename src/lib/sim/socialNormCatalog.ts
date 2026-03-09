import { ACTION_RULE_PRESETS, createActionRuleFromTable, type ActionRuleDefinition } from './actionRules'
import { decodeCustomNormCode, encodeCustomNormCode, isCustomNormCode, normalizeCustomNormCode } from './customNormCode'
import { createNormFromTable, NORM_PRESETS, type NormDefinition } from './norms'
import { SOCIAL_NORM_PRESETS } from './socialNormPresets'
import type { CustomNormCode } from './types'

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

export function listAvailableSocialNorms(customNorms: CustomNormCode[]): SocialNormListItem[] {
  return [
    ...SOCIAL_NORM_PRESETS.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      source: 'preset' as const,
    })),
    ...customNorms.map((code) => ({
      id: code,
      name: code,
      description: `Custom norm ${code}`,
      source: 'custom' as const,
    })),
  ]
}

export function validateCustomSocialNorm(code: CustomNormCode): void {
  const normalized = normalizeCustomNormCode(code)
  if (!isCustomNormCode(normalized)) {
    throw new Error(`Invalid custom norm code: ${code}`)
  }
  decodeCustomNormCode(normalized)
}

export function validateCustomSocialNormCollection(customNorms: CustomNormCode[]): void {
  const ids = new Set<string>()
  for (const code of customNorms) {
    const normalized = normalizeCustomNormCode(code)
    validateCustomSocialNorm(normalized)
    if (ids.has(normalized)) {
      throw new Error(`Duplicate custom norm code: ${normalized}`)
    }
    ids.add(normalized)
  }
}

export function resolveSocialNorm(
  socialNormId: string,
  customNorms: CustomNormCode[] = [],
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

  const normalizedId = normalizeCustomNormCode(socialNormId)
  const customCode = customNorms.find((item) => normalizeCustomNormCode(item) === normalizedId)
  if (!customCode) {
    throw new Error(`Unknown social norm id: ${socialNormId}`)
  }

  validateCustomSocialNorm(customCode)
  const { assessmentTable, actionTable } = decodeCustomNormCode(customCode)

  return {
    id: normalizedId,
    name: normalizedId,
    description: `Custom norm ${normalizedId}`,
    assessmentRule: createNormFromTable(
      `${normalizedId}-assessment`,
      `${normalizedId} Assessment`,
      `Assessment rule derived from ${normalizedId}.`,
      assessmentTable,
    ),
    actionRule: createActionRuleFromTable(
      `${normalizedId}-action`,
      `${normalizedId} Action`,
      `Action rule derived from ${normalizedId}.`,
      actionTable,
    ),
    source: 'custom',
  }
}

export function duplicatePresetAsCustom(socialNormId: string): CustomNormCode {
  const preset = SOCIAL_NORM_PRESETS.find((item) => item.id === socialNormId)
  if (!preset) {
    throw new Error(`Unknown social norm id: ${socialNormId}`)
  }

  const assessmentPreset = NORM_PRESETS.find((item) => item.id === preset.assessmentRuleId)
  const actionPreset = ACTION_RULE_PRESETS.find((item) => item.id === preset.actionRuleId)
  if (!assessmentPreset || !actionPreset) {
    throw new Error(`Social norm preset is not fully defined: ${socialNormId}`)
  }

  return encodeCustomNormCode(assessmentPreset.table, actionPreset.table)
}
