export function iso8601WithLocalOffset(date: Date): string {
  const timezoneOffset = -date.getTimezoneOffset()
  const dif = timezoneOffset >= 0 ? '+' : '-'
  return `${date.getFullYear()}-${padNumber(
    date.getMonth() + 1,
    2,
  )}-${padNumber(date.getDate(), 2)}T${padNumber(
    date.getHours(),
    2,
  )}:${padNumber(date.getMinutes(), 2)}:${padNumber(
    date.getSeconds(),
    2,
  )}${dif}${padNumber(timezoneOffset / 60, 2)}:${padNumber(
    timezoneOffset % 60,
    2,
  )}`
}

function padNumber(num: number, maxLength: number): string {
  return num.toString().padStart(maxLength, '0')
}
