# Infer Actual Type Helpers for TypeScript

Let's assume we want to create a partial object, that is, one that contains only a subset of the properties of an object type `FinalObj`, defined as

```ts
interface FinalObj {
  n: number
  s: string
}
```

When we create a new object like this:

```ts
const obj: Partial<FinalObj> = { n: 1 }
```

the variable `obj` would be of type `Partial<FinalObj>`.

Let us assume, however, that we want to infer the actual type structure `{ n: number }`, but still want to constrain it to be a `Partial<FinalObj>`. As TypeScript 3.8 does not provide a out-of-the-box solution for this, this package provides helper functions that make this possible:

```ts
const inferPartialOfFinalObj = inferActualPartialType<FinalObj>()
// create `part` inferring its actual type `{ n: number }`
const part = inferPartialOfFinalObj({ n: 1 }})
```

As TypeScript (<= 3.8) does not support [Partial Type Argument Inference](https://github.com/microsoft/TypeScript/issues/26242), we have to use a workaround: the helper functions have to be curried / higher-order functions, i.e. they are functions that capture the desired base type and return a corresponding function. Of course you can call the returned function directly, which will shorten the code to:

```ts
const part = inferActualPartialType<FinalObj>()({ n: 1 })
```
