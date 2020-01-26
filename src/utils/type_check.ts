export function throwIfUndefined<T>(
  value: T | undefined,
  valueName?: string,
): T {
  if (value === undefined) {
    throw new Error(`${valueName || 'Value'} is undefined`)
  }
  return value
}
