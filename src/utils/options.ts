export function createIsOptionEnabled(
  enableByDefault = true
): (option: unknown) => boolean {
  return enableByDefault
    ? isOptionEnabledByDefaultTrue
    : isOptionEnabledByDefaultFalse
}

export function isOptionEnabled(
  option: unknown,
  enableByDefault = true
): boolean {
  return enableByDefault
    ? isOptionEnabledByDefaultTrue(option)
    : isOptionEnabledByDefaultFalse(option)
}

export function isOptionEnabledByDefaultTrue(option: unknown): boolean {
  if (typeof option === "object" && option !== null) {
    return (option as Enableable<Record<string, unknown>>).enable !== false
  } else {
    return option !== false
  }
}

export function isOptionEnabledByDefaultFalse(option: unknown): boolean {
  return (
    (typeof option === "object" &&
      option !== null &&
      (option as Enableable<Record<string, unknown>>).enable === true) ||
    option === true
  )
}

// eslint-disable-next-line @typescript-eslint/ban-types
export type Enableable<T extends object> = T & { enable?: boolean }
