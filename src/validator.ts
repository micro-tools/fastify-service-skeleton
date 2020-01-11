import Ajv from 'ajv'

const staticAjvInstance = Ajv()

export class Validator<T> {
  readonly validateFunc: Ajv.ValidateFunction
  readonly schema: object
  readonly schemaName: string

  constructor(schemaName: string, schema: object, options?: Ajv.Options) {
    const ajv = options ? new Ajv(options) : staticAjvInstance
    this.validateFunc = ajv.compile(schema)
    this.schema = schema
    this.schemaName = schemaName
  }

  validate(
    candidate: unknown,
    resultHandler?: ValidationResultHandler,
  ): candidate is T {
    const isValid = this.validateFunc(candidate) as boolean
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
        },
      )
    }
    return isValid
  }

  // static because `asserts` return type did not work with TypeScript 3.7.4
  static assert<T>(
    validator: Validator<T>,
    candidate: any,
    resultHandler?: ValidationResultHandler,
  ): asserts candidate is T {
    if (!validator.validate(candidate, resultHandler)) {
      throw new ValidationError(
        candidate,
        validator.schemaName,
        validator.schema,
        validator.validateFunc.errors!,
      )
    }
  }
}

export class ValidationError extends Error {
  constructor(
    readonly candidate: unknown,
    readonly schemaName: string,
    readonly schema: object,
    readonly validationErrors: Ajv.ErrorObject[],
  ) {
    super(
      `Invalid ${schemaName}: ${staticAjvInstance.errorsText(
        validationErrors,
      )}`,
    )
  }
}

export type ValidationResultHandler = (
  error: ValidationError | null,
  context: ValidationContext,
) => void

export interface ValidationContext {
  candidate: unknown
  schema: object
  schemaName: string
}
