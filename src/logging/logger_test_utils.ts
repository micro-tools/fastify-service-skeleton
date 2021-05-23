/* eslint-disable no-console */

import stream from "stream"
import { once } from "events"
import split from "split2"
import writer from "flush-write-stream"
import * as rx from "rxjs"
import * as rxOp from "rxjs/operators"

// helper function copied from pino tests
export function createDestinationStream(
  func?: Parameters<typeof writer.obj>[0]
): stream.Transform {
  const result = split((data) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return JSON.parse(data)
    } catch (err) {
      console.log(err)
      console.log(data)
    }
  })
  if (func) result.pipe(writer.obj(func))
  return result
}

export async function nextLog(
  destinationStream: stream.Transform
): Promise<Record<string, unknown>> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const [log] = await once(destinationStream, "data")
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return log
}

export function collectLogsUntil(
  destinationStream: stream.Transform,
  stopPromise: Promise<unknown>,
  consoleLogItems = false
): Promise<Record<string, unknown>[]> {
  let stream = rx.fromEvent(destinationStream, "data") as rx.Observable<
    Record<string, unknown>
  >
  if (consoleLogItems) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    stream = stream.pipe(rxOp.tap(console.log))
  }
  return rx.firstValueFrom(
    stream.pipe(rxOp.takeUntil(rx.from(stopPromise)), rxOp.toArray())
  )
}
