import { describe, expect, it } from 'vitest'
import {
  duplicatePresetAsCustom,
  resolveSocialNorm,
  validateCustomSocialNorm,
  validateCustomSocialNormCollection,
} from '../socialNormCatalog'

function makeCustomNorm() {
  return 'GBBGGBBG-CDCD'
}

describe('social norm catalog', () => {
  it('resolves a custom norm', () => {
    const norm = makeCustomNorm()
    const resolved = resolveSocialNorm(norm, [norm])

    expect(resolved.source).toBe('custom')
    expect(
      resolved.assessmentRule.assessDonor({
        observerViewOfDonor: 'G',
        observerViewOfRecipient: 'B',
        realizedAction: 'D',
      }),
    ).toBe('G')
    expect(
      resolved.actionRule.decide({
        donor: 0,
        recipient: 1,
        donorViewOfSelf: 'G',
        donorViewOfRecipient: 'B',
      }),
    ).toBe('D')
  })

  it('duplicates a preset into editable custom tables', () => {
    const duplicated = duplicatePresetAsCustom('leading-eight-l6')

    expect(duplicated).toBe('GBBGGBBG-CDCD')
  })

  it('rejects malformed custom norm codes', () => {
    expect(() => validateCustomSocialNorm('GBBGGBBG-CDC')).toThrow('Invalid custom norm code: GBBGGBBG-CDC')
  })

  it('rejects duplicate custom codes in a collection', () => {
    const customNorm = makeCustomNorm()

    expect(() => validateCustomSocialNormCollection([customNorm, customNorm])).toThrow('Duplicate custom norm code: GBBGGBBG-CDCD')
  })
})
