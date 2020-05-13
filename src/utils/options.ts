export function createIsOptionEnabled(
  enableByDefault = true,
): (option: unknown) => boolean {
  return enableByDefault
    ? isOptionEnabledByDefaultTrue
    : isOptionEnabledByDefaultFalse
}

export function isOptionEnabled(
  option: unknown,
  enableByDefault = true,
): boolean {
  return enableByDefault
    ? isOptionEnabledByDefaultTrue(option)
    : isOptionEnabledByDefaultFalse(option)
}

export function isOptionEnabledByDefaultTrue(option: unknown): boolean {
  if (typeof option === 'object' && option !== null) {
    return (option as Enableable<object>).enable !== false
  } else {
    return option !== false
  }
}

export function isOptionEnabledByDefaultFalse(option: unknown): boolean {
  return (
    (typeof option === 'object' &&
      option !== null &&
      (option as Enableable<object>).enable === true) ||
    option === true
  )
}

export type Enableable<T extends {}> = T & { enable?: boolean }
