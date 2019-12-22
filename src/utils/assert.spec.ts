import {
  assertIsNonEmptyObject,
  assertIsNotNullish,
  assertIsNotUndefined,
  AssertionError,
} from './assert'

describe('assert utils', () => {
  describe('assertIsNotUndefined', () => {
    it('throws an AssertionError on undefined', () => {
      expect(() => assertIsNotUndefined(undefined)).toThrowError(AssertionError)
      for (const defined of [null, 0, '', {}]) {
        expect(() => assertIsNotUndefined(defined))
      }
    })
  })

  describe('assertIsNotNullish', () => {
    it('throws an AssertionError on null or undefined', () => {
      expect(() => assertIsNotNullish(undefined)).toThrowError(AssertionError)
      expect(() => assertIsNotNullish(null)).toThrowError(AssertionError)
      for (const defined of [0, '', {}]) {
        expect(() => assertIsNotNullish(defined))
      }
    })
  })

  describe('assertIsNonEmptyObject', () => {
    it('throws an AssertionError on empty objects', () => {
      expect(() => assertIsNonEmptyObject({})).toThrowError(AssertionError)
      expect(() => assertIsNonEmptyObject(Object.create(null))).toThrowError(
        AssertionError,
      )
      expect(() => assertIsNonEmptyObject({ a: 1 }))
    })
  })
})
