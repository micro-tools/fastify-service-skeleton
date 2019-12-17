import { ok, AssertionError } from 'assert'

export const assert: (
  condition: any,
  message?: string | Error,
) => asserts condition = ok

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

type NotUndefined<T> = T extends undefined ? never : T
type NotNullish<T> = T extends undefined | null ? never : T
