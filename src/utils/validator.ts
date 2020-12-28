import Ajv, * as ajv from "ajv"
import addFormats from "ajv-formats"

const staticAjvInstance = addFormats(new Ajv())

export class Validator<T> {
  readonly validateFunc: ajv.ValidateFunction<T>
  readonly schema: ValidationSchema
  readonly schemaName: string

  constructor(
    schemaName: string,
    schema: ValidationSchema,
    options?: ajv.Options
  ) {
    const ajv = options ? addFormats(new Ajv(options)) : staticAjvInstance
    this.validateFunc = ajv.compile(schema)
    this.schema = schema
    this.schemaName = schemaName
  }

  validate(
    candidate: unknown,
    resultHandler?: ValidationResultHandler
  ): candidate is T {
    const isValid = this.validateFunc(candidate)
    if (resultHandler) {
      const errors = this.validateFunc.errors ?? null
      resultHandler(
        errors !== null
          ? new ValidationError(candidate, this.schemaName, this.schema, errors)
          : null,
        {
          candidate,
          schema: this.schema,
          schemaName: this.schemaName,
        }
      )
    }
    return isValid
  }

  // static because `asserts` return type did not work with TypeScript 3.7.4
  static assert<T>(
    validator: Validator<T>,
    candidate: unknown,
    resultHandler?: ValidationResultHandler
  ): asserts candidate is T {
    if (!validator.validate(candidate, resultHandler)) {
      throw new ValidationError(
        candidate,
        validator.schemaName,
        validator.schema,
        validator.validateFunc.errors!
      )
    }
  }
}

export class ValidationError extends Error {
  constructor(
    readonly candidate: unknown,
    readonly schemaName: string,
    readonly schema: ValidationSchema,
    readonly validationErrors: ajv.ErrorObject[]
  ) {
    super(
      `Invalid ${schemaName}: ${staticAjvInstance.errorsText(validationErrors)}`
    )
  }
}

export type ValidationResultHandler = (
  error: ValidationError | null,
  context: ValidationContext
) => void

export interface ValidationContext {
  candidate: unknown
  schema: ValidationSchema
  schemaName: string
}

export type ValidationSchema = ajv.Schema
