export function createIsOptionEnabled(
  enableByDefault = true,
): (option: any) => boolean {
  return enableByDefault
    ? isOptionEnabledByDefaultTrue
    : isOptionEnabledByDefaultFalse
}

export function isOptionEnabled(option: any, enableByDefault = true): boolean {
  return enableByDefault
    ? isOptionEnabledByDefaultTrue(option)
    : isOptionEnabledByDefaultFalse(option)
}

export function isOptionEnabledByDefaultTrue(option: any): boolean {
  if (typeof option === 'object' && option !== null) {
    return option.enable !== false
  } else {
    return option !== false
  }
}

export function isOptionEnabledByDefaultFalse(option: any): boolean {
  return (
    (typeof option === 'object' && option !== null && option.enable === true) ||
    option === true
  )
}

export type Enableable<T extends {}> = T & { enable?: boolean }
