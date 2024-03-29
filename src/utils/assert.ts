import { ok, AssertionError } from "assert"

export { AssertionError }

export function assert(
  condition: unknown,
  message?: string | Error | undefined
): asserts condition {
  return ok(condition, message)
}

export function assertIsNotUndefined<T>(
  value: T | undefined,
  valueName?: string
): asserts value is NotUndefined<T> {
  return assert(
    value !== undefined,
    `Expected ${valueName || "value"} to be not undefined`
  )
}

export function assertIsNotNullish<T>(
  value: T | null | undefined,
  valueName?: string
): asserts value is NotNullish<T> {
  return assert(
    value !== undefined && value !== null,
    `Expected ${valueName || "value"} to be not undefined or null`
  )
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function assertIsNonEmptyObject<T extends object>(
  // eslint-disable-next-line @typescript-eslint/ban-types
  obj: T | object,
  valueName?: string
): asserts obj is T {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      return
    }
  }
  throw new AssertionError({
    message: `Expected ${valueName || "value"} to be a non-empty object`,
  })
}

export type NotUndefined<T> = T extends undefined ? never : T
export type NotNullish<T> = T extends undefined | null ? never : T
