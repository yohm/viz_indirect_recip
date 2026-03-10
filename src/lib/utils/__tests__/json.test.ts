import { describe, expect, it } from 'vitest'
import { normalizeSettingsDocument } from '../json'

describe('settings document normalization', () => {
  it('preserves valid v2 settings documents', () => {
    const normalized = normalizeSettingsDocument({
      version: 2,
      parameters: {
        numAgents: 30,
        populationMode: 'monomorphic',
        socialNormId: 'leading-eight-l6',
        assessmentMode: 'private',
        observationProbability: 1,
        actionErrorProbability: 0,
        assessmentErrorProbability: 0.02,
        initialReputationMode: 'all-good',
        seed: 42,
        autoplayStepsPerSecond: 30,
        maxEventLogSize: 50,
      },
      customSocialNorms: [],
    })

    expect(normalized.parameters.numAgents).toBe(30)
  })

  it('passes through unsupported numAgents for later validation failures', () => {
    const normalized = normalizeSettingsDocument({
      version: 2,
      parameters: {
        numAgents: 90,
        populationMode: 'polymorphic',
        socialNormId: 'leading-eight-l6',
        assessmentMode: 'private',
        observationProbability: 1,
        actionErrorProbability: 0,
        assessmentErrorProbability: 0.02,
        initialReputationMode: 'all-good',
        seed: 42,
        autoplayStepsPerSecond: 30,
        maxEventLogSize: 50,
      },
      customSocialNorms: [],
    } as Parameters<typeof normalizeSettingsDocument>[0])

    expect(normalized.parameters.numAgents).toBe(90)
  })
})
