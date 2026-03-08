export interface SeededRng {
  next(): number
  nextInt(maxExclusive: number): number
  nextBool(probability: number): boolean
  getState(): number
}

const UINT32_MAX = 0xffffffff

function normalizeSeed(seed: number): number {
  const normalized = seed >>> 0
  return normalized === 0 ? 0x9e3779b9 : normalized
}

export function createRng(seed: number): SeededRng {
  let state = normalizeSeed(seed)

  const nextUint32 = (): number => {
    // xorshift32: tiny deterministic generator suitable for simulation reproducibility.
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    state >>>= 0
    return state
  }

  return {
    next(): number {
      return nextUint32() / (UINT32_MAX + 1)
    },
    nextInt(maxExclusive: number): number {
      if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
        throw new Error(`maxExclusive must be a positive integer. Received: ${maxExclusive}`)
      }
      return Math.floor(this.next() * maxExclusive)
    },
    nextBool(probability: number): boolean {
      if (probability <= 0) return false
      if (probability >= 1) return true
      return this.next() < probability
    },
    getState(): number {
      return state
    },
  }
}
