import { describe, expect, it } from 'vitest'
import { getActionRuleById } from '../actionRules'
import { getNormById } from '../norms'
import { SOCIAL_NORM_PRESETS, getSocialNormById } from '../socialNormPresets'

describe('leading eight presets', () => {
  it('maps each preset to an existing norm and action rule', () => {
    const leadingEight = SOCIAL_NORM_PRESETS.filter((item) => item.id.startsWith('leading-eight-'))
    for (const preset of leadingEight) {
      const loaded = getSocialNormById(preset.id)
      const norm = getNormById(loaded.assessmentRuleId)
      const actionRule = getActionRuleById(loaded.actionRuleId)

      expect(norm.id).toBe(loaded.assessmentRuleId)
      expect(actionRule.id).toBe(loaded.actionRuleId)
    }
  })

  it('keeps L1 and L2 action rule equal but assessment tables distinct', () => {
    const l1 = getSocialNormById('leading-eight-l1')
    const l2 = getSocialNormById('leading-eight-l2')

    expect(l1.actionRuleId).toBe(l2.actionRuleId)

    const normL1 = getNormById(l1.assessmentRuleId)
    const normL2 = getNormById(l2.assessmentRuleId)

    const context = {
      observerViewOfDonor: 'G' as const,
      observerViewOfRecipient: 'B' as const,
      realizedAction: 'C' as const,
    }

    expect(normL1.assessDonor(context)).toBe('G')
    expect(normL2.assessDonor(context)).toBe('B')
  })
})
