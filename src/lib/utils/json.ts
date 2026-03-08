export function toPrettyJson(value: unknown): string {
  return JSON.stringify(value, null, 2)
}

export function parseJson<T>(text: string): T {
  return JSON.parse(text) as T
}
