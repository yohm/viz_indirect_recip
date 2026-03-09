import { describe, expect, it } from 'vitest'
import {
  duplicatePresetAsCustom,
  resolveSocialNorm,
  validateCustomSocialNorm,
  validateCustomSocialNormCollection,
} from '../socialNormCatalog'
import type { CustomSocialNormDefinition } from '../types'

function makeCustomNorm(): CustomSocialNormDefinition {
  return {
    id: 'custom-1',
    name: 'Custom 1',
    description: 'A user-defined norm.',
    assessmentRule: {
      id: 'custom-1-assessment',
      name: 'Custom 1 Assessment',
      description: '',
      table: {
        'G-G-C': 'G',
        'G-G-D': 'B',
        'G-B-C': 'B',
        'G-B-D': 'G',
        'B-G-C': 'G',
        'B-G-D': 'B',
        'B-B-C': 'B',
        'B-B-D': 'G',
      },
    },
    actionRule: {
      id: 'custom-1-action',
      name: 'Custom 1 Action',
      description: '',
      table: {
        'G-G': 'C',
        'G-B': 'D',
        'B-G': 'C',
        'B-B': 'D',
      },
    },
  }
}

describe('social norm catalog', () => {
  it('resolves a custom norm', () => {
    const norm = makeCustomNorm()
    const resolved = resolveSocialNorm(norm.id, [norm])

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
    const duplicated = duplicatePresetAsCustom('leading-eight-l6', 'custom-l6', 'Custom L6')

    expect(duplicated.id).toBe('custom-l6')
    expect(duplicated.assessmentRule.table['G-B-C']).toBe('B')
    expect(duplicated.actionRule.table['B-B']).toBe('D')
  })

  it('rejects reuse of a built-in preset id', () => {
    expect(() => validateCustomSocialNorm({ ...makeCustomNorm(), id: 'shunning' })).toThrow(
      'Custom social norm id conflicts with a built-in preset: shunning',
    )
  })

  it('rejects duplicate custom ids in a collection', () => {
    const customNorm = makeCustomNorm()

    expect(() => validateCustomSocialNormCollection([customNorm, { ...customNorm }])).toThrow(
      'Duplicate custom social norm id: custom-1',
    )
  })
})
