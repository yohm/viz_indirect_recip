import type { ActionTable, AssessmentTable, CustomNormCode } from './types'

const CUSTOM_NORM_CODE_PATTERN = /^[GB]{8}-[CD]{4}$/

export function isCustomNormCode(value: string): boolean {
  return CUSTOM_NORM_CODE_PATTERN.test(value)
}

export function normalizeCustomNormCode(value: string): CustomNormCode {
  return value.trim().toUpperCase()
}

export function encodeCustomNormCode(assessmentTable: AssessmentTable, actionTable: ActionTable): CustomNormCode {
  return `${[
    assessmentTable['G-G-C'],
    assessmentTable['G-G-D'],
    assessmentTable['G-B-C'],
    assessmentTable['G-B-D'],
    assessmentTable['B-G-C'],
    assessmentTable['B-G-D'],
    assessmentTable['B-B-C'],
    assessmentTable['B-B-D'],
  ].join('')}-${[
    actionTable['G-G'],
    actionTable['G-B'],
    actionTable['B-G'],
    actionTable['B-B'],
  ].join('')}`
}

export function decodeCustomNormCode(code: string): { assessmentTable: AssessmentTable; actionTable: ActionTable } {
  const normalized = normalizeCustomNormCode(code)
  if (!isCustomNormCode(normalized)) {
    throw new Error(`Invalid custom norm code: ${code}`)
  }

  const [assessmentPart, actionPart] = normalized.split('-')

  return {
    assessmentTable: {
      'G-G-C': assessmentPart[0] as 'G' | 'B',
      'G-G-D': assessmentPart[1] as 'G' | 'B',
      'G-B-C': assessmentPart[2] as 'G' | 'B',
      'G-B-D': assessmentPart[3] as 'G' | 'B',
      'B-G-C': assessmentPart[4] as 'G' | 'B',
      'B-G-D': assessmentPart[5] as 'G' | 'B',
      'B-B-C': assessmentPart[6] as 'G' | 'B',
      'B-B-D': assessmentPart[7] as 'G' | 'B',
    },
    actionTable: {
      'G-G': actionPart[0] as 'C' | 'D',
      'G-B': actionPart[1] as 'C' | 'D',
      'B-G': actionPart[2] as 'C' | 'D',
      'B-B': actionPart[3] as 'C' | 'D',
    },
  }
}
