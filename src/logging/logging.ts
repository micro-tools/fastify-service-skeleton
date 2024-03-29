import { FastifyServerOptions } from "fastify"
import { ServiceSkeletonOptions } from "../skeleton"
import { createRootLogger, RootLogger } from "./root_logger"
import { Logger } from "./logging.types"
import { isOptionEnabled } from "../utils/options"

export function createLoggers(
  serviceName: string,
  loggingOpts: ServiceSkeletonOptions["logging"]
): { rootLogger: RootLogger; appLogger: Logger } {
  const rootLogger = createRootLogger(serviceName, loggingOpts || undefined)
  const appLogger = rootLogger.child({ log_type: "application" })
  return { rootLogger, appLogger }
}

export function checkLoggingOptionsPlausibility(
  appLogger: Logger,
  opts: ServiceSkeletonOptions,
  finalFastifyOpts: FastifyServerOptions
): void {
  if (
    (opts.fastify as FastifyServerOptions | undefined)?.logger !== undefined
  ) {
    appLogger.warn(
      "You have provided fastify.logger options, but they will be ignored. Use the skeleton's logger options instead."
    )
  }

  if (
    finalFastifyOpts.disableRequestLogging !== true &&
    isOptionEnabled(opts.plugins?.requestLogging, opts.enablePluginsByDefault)
  ) {
    appLogger.warn(
      "You have enabled fastify's default request logging in addition to the requestLogging plugin."
    )
  }
}
