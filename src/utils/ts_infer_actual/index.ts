/* eslint-disable @typescript-eslint/explicit-function-return-type */

import type { DeepPartial } from "utility-types"
import { identity } from "../identity"

export function inferActualType<Basis extends object>(): <Obj extends Basis>(
  obj: Obj
) => Obj {
  return identity
}

export function inferActualPartialType<Basis extends object>(): <
  Obj extends Partial<Basis>
>(
  obj: Obj
) => Obj {
  return identity
}

export function inferActualDeepPartialType<Basis extends object>(): <
  Obj extends DeepPartial<Basis>
>(
  obj: Obj
) => Obj {
  return identity
}

// re-export utility types
export type { DeepPartial }
