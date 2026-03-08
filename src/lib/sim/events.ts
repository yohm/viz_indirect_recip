import type { InteractionEvent } from './types'

export function appendEvent(events: InteractionEvent[], event: InteractionEvent, maxSize: number): InteractionEvent[] {
  if (maxSize <= 0) return []

  const next = [...events, event]
  if (next.length <= maxSize) return next
  return next.slice(next.length - maxSize)
}
