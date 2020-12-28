import { Validator, ValidationSchema, ValidationError } from "./validator"

test("validate() validates objects", () => {
  const someObjValidator = new Validator<SomeObj>("someObj", someObjSchema)
  for (const valid of validSomeObjs) {
    expect(someObjValidator.validate(valid)).toBe(true)
  }
  for (const invalid of invalidSomeObjs) {
    expect(someObjValidator.validate(invalid)).toBe(false)
  }
})

test("assert() validates objects and throws if the validation fails", () => {
  const someObjValidator = new Validator<SomeObj>("someObj", someObjSchema)
  for (const valid of validSomeObjs) {
    expect(() => Validator.assert(someObjValidator, valid)).not.toThrow()
  }
  for (const invalid of invalidSomeObjs) {
    expect(() => Validator.assert(someObjValidator, invalid)).toThrow(
      ValidationError
    )
  }
})

test("Supports additional ajv-formats like date", () => {
  const validator = new Validator("date", {
    type: "string",
    format: "date",
    formatMinimum: "2016-02-06",
    formatExclusiveMaximum: "2016-12-27",
  })

  const validData = ["2016-02-06", "2016-12-26"]
  for (const valid of validData) {
    expect(validator.validate(valid)).toBe(true)
  }

  const invalidData = ["2016-02-05", "2016-12-27", "abc"]
  for (const invalid of invalidData) {
    expect(validator.validate(invalid)).toBe(false)
  }
})

interface SomeObj {
  n: number
  s: string[]
  o?: { m: number }
}

const someObjSchema: ValidationSchema = {
  type: "object",
  properties: {
    n: { type: "number" },
    s: { type: "array", items: { type: "string" } },
    o: { type: "object", properties: { m: { type: "number" } } },
  },
  required: ["n", "s"],
}

const validSomeObjs: SomeObj[] = [
  { n: 1, s: ["s1"] },
  { n: 1, s: ["s1"], o: { m: 1 } },
]

const invalidSomeObjs = [{}, { n: "1", s: ["s1"] }]
