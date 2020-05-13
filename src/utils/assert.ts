import { ok, AssertionError } from 'assert'

export { AssertionError }

export function assert(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  condition: any,
  message?: string | Error | undefined,
): asserts condition {
  return ok(condition, message)
}

export function assertIsNotUndefined<T>(
  value: T,
  valueName?: string,
): asserts value is NotUndefined<T> {
  return assert(
    value !== undefined,
    `Expected ${valueName || 'value'} to be not undefined`,
  )
}

export function assertIsNotNullish<T>(
  value: T,
  valueName?: string,
): asserts value is NotNullish<T> {
  return assert(
    value !== undefined && value !== null,
    `Expected ${valueName || 'value'} to be not undefined or null`,
  )
}

export function assertIsNonEmptyObject<T extends object>(
  obj: T | {},
  valueName?: string,
): asserts obj is T {
  for (const key in obj) {
    if (hasOwnProperty.call(obj, key)) {
      return
    }
  }
  throw new AssertionError({
    message: `Expected ${valueName || 'value'} to be a non-empty object`,
  })
}

const hasOwnProperty = Object.prototype.hasOwnProperty

export type NotUndefined<T> = T extends undefined ? never : T
export type NotNullish<T> = T extends undefined | null ? never : T
