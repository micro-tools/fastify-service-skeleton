import pino from "pino"

export type Logger = pino.Logger

export type LoggerOptions = pino.LoggerOptions

export interface LoggingOptions extends LoggerOptions {
  appLogger?: pino.LoggerOptions | boolean
  destination?: pino.DestinationStream
}
