import {
  isOptionEnabledByDefaultTrue,
  isOptionEnabledByDefaultFalse,
} from './options'

describe('options util', () => {
  describe('isOptionEnabledByDefaultTrue', () => {
    it('indicates that an option should be enabled unless it is disabled explicitily', () => {
      const expectToBeTrue = [
        true,
        { enable: true },
        {},
        undefined,
        null,
        [],
        0,
      ]
      const expectToBeFalse = [false, { enable: false }]
      for (const option of expectToBeTrue) {
        expect(isOptionEnabledByDefaultTrue(option))
      }
      for (const option of expectToBeFalse) {
        expect(isOptionEnabledByDefaultTrue(option)).toBe(false)
      }
    })
  })

  describe('isOptionEnabledByDefaultFalse', () => {
    it('indicates that an option should be disabled unless it is enabled explicitily', () => {
      const expectToBeTrue = [true, { enable: true }]
      const expectToBeFalse = [
        false,
        { enable: false },
        undefined,
        {},
        null,
        [],
        0,
      ]
      for (const option of expectToBeTrue) {
        expect(isOptionEnabledByDefaultFalse(option))
      }
      for (const option of expectToBeFalse) {
        expect(isOptionEnabledByDefaultFalse(option)).toBe(false)
      }
    })
  })
})
