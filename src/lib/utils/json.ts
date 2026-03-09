import type { CustomSocialNormDefinition, SimulationParameters } from '../sim/types'

export interface SimulationSettingsDocumentV2 {
  version: 2
  parameters: SimulationParameters
  customSocialNorms: CustomSocialNormDefinition[]
}

export type SimulationSettingsDocument = SimulationParameters | SimulationSettingsDocumentV2

export function toPrettyJson(value: unknown): string {
  return JSON.stringify(value, null, 2)
}

export function parseJson<T>(text: string): T {
  return JSON.parse(text) as T
}

function isSettingsDocumentV2(parsed: SimulationSettingsDocument): parsed is SimulationSettingsDocumentV2 {
  return 'version' in parsed && parsed.version === 2
}

export function normalizeSettingsDocument(parsed: SimulationSettingsDocument): SimulationSettingsDocumentV2 {
  if (isSettingsDocumentV2(parsed)) {
    return {
      version: 2,
      parameters: parsed.parameters,
      customSocialNorms: parsed.customSocialNorms ?? [],
    }
  }

  return {
    version: 2,
    parameters: parsed,
    customSocialNorms: [],
  }
}
