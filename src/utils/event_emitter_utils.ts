import { EventEmitter } from "events"

/**
 * Adds an event listener to an EventEmitter only if the listener has not
 * already been added.
 *
 * @param emitter The EventEmitter the listener shall be added to.
 * @param event The event the listener shall be added to.
 * @param listener The event listener that shall be added only once.
 * @param asOnceListener If the listener should be called at most once.
 * @returns If the listener has been added.
 */
export function addEventListenerOnlyOnce(
  emitter: EventEmitter,
  event: string | symbol,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listener: (...args: any[]) => void,
  asOnceListener = false
): boolean {
  const listeners = emitter.listeners(event)
  if (listeners.includes(listener)) {
    return false
  } else {
    if (asOnceListener) {
      emitter.once(event, listener)
    } else {
      emitter.on(event, listener)
    }
    return true
  }
}
