import type { Action, AgentStrategy, AllowedNumAgents, DonorDecisionContext, PopulationMode, Reputation } from './types'
import type { NormAssessmentContext } from './norms'
import type { ResolvedSocialNorm } from './socialNormCatalog'

function buildMonomorphicStrategies(numAgents: AllowedNumAgents): AgentStrategy[] {
  return Array.from({ length: numAgents }, () => 'focal')
}

function buildPolymorphicStrategies(numAgents: AllowedNumAgents): AgentStrategy[] {
  const blockSize = numAgents / 3

  return Array.from({ length: numAgents }, (_, agent) => {
    if (agent < blockSize) return 'focal'
    if (agent < blockSize * 2) return 'alld'
    return 'allc'
  })
}

export function buildAgentStrategies(numAgents: AllowedNumAgents, populationMode: PopulationMode): AgentStrategy[] {
  if (populationMode === 'monomorphic') {
    return buildMonomorphicStrategies(numAgents)
  }

  return buildPolymorphicStrategies(numAgents)
}

export function resolveIntendedAction(
  strategy: AgentStrategy,
  focalNorm: ResolvedSocialNorm,
  context: DonorDecisionContext,
): Action {
  if (strategy === 'alld') {
    return 'D'
  }
  if (strategy === 'allc') {
    return 'C'
  }
  return focalNorm.actionRule.decide(context)
}

export function resolveDonorAssessment(
  strategy: AgentStrategy,
  focalNorm: ResolvedSocialNorm,
  context: NormAssessmentContext,
): Reputation {
  if (strategy === 'alld') {
    return 'B'
  }
  if (strategy === 'allc') {
    return 'G'
  }
  return focalNorm.assessmentRule.assessDonor(context)
}
