import {
  inferActualType,
  inferActualPartialType,
  inferActualDeepPartialType,
} from "."

interface SomeObj {
  a: { n: number; s: string; o?: number | null }
  b: number
}

test("inferActualType infers the actual type schema based on a given type argument", () => {
  const inferActualSomeObj = inferActualType<SomeObj>()
  // type annotation tests the expected return type
  const someObj: {
    a: { n: number; s: string; o: number }
    b: number
  } = inferActualSomeObj({
    a: { n: 1, s: "test", o: 1 },
    b: 1,
  })
  // as it is just a identity function at runtime, test if input equals output
  expect(someObj).toEqual({
    a: { n: 1, s: "test", o: 1 },
    b: 1,
  })
})

test("inferActualPartialType infers the actual partial type schema based on a given type argument", () => {
  const inferActualPartialOfSomeObj = inferActualPartialType<SomeObj>()
  // type annotation tests the expected return type
  const someObjPartial: {
    a: { n: number; s: string }
  } = inferActualPartialOfSomeObj({
    a: { n: 1, s: "test" },
  })
  // the factory is just a identity function, so test if input equals output
  expect(someObjPartial).toEqual({ a: { n: 1, s: "test" } })
})

test("inferActualPartialType infers the actual deep-partial type schema based on a given type argument", () => {
  const inferActualDeepPartialOfSomeObj = inferActualDeepPartialType<SomeObj>()
  // type annotation tests the expected return type
  const someObjDeepPartial: {
    a: { n: number }
  } = inferActualDeepPartialOfSomeObj({
    a: { n: 1 },
  })
  // the factory is just a identity function, so test if input equals output
  expect(someObjDeepPartial).toEqual({ a: { n: 1 } })
})
