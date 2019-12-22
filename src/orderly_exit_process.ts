import { Logger, createExitListener } from './logger/logger'

export function orderlyExitProcess(logger: Logger) {
  process.on(
    'uncaughtException',
    createExitListener(logger, (err, finalLogger) => {
      finalLogger.error(err, 'uncaughtException')
      process.exit(1)
    }),
  )

  process.on(
    'unhandledRejection',
    createExitListener(logger, (err, finalLogger) => {
      finalLogger.error(err, 'unhandledRejection')
      process.exit(1)
    }) as NodeJS.UnhandledRejectionListener,
  )
}
