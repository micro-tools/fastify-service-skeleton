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
): Promise<LogObj> {
  const [log] = await once(destinationStream, "data")
  return log
}

export function collectLogsUntil(
  destinationStream: stream.Transform,
  stopPromise: Promise<unknown>,
  consoleLogItems = false
): Promise<LogObj[]> {
  let stream = rx.fromEvent<LogObj>(destinationStream, "data")
  if (consoleLogItems) {
    stream = stream.pipe(rxOp.tap(console.log))
  }
  return stream
    .pipe(rxOp.takeUntil(rx.from(stopPromise)), rxOp.toArray())
    .toPromise()
}

interface LogObj {
  [prop: string]: unknown
}
