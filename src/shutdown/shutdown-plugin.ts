import { FastifyInstance } from "fastify"
import fastifyPlugin from "fastify-plugin"

export const shutdownPlugin = fastifyPlugin(initShutdownPlugin, {
  name: "shutdown",
  fastify: "3.x",
})

async function initShutdownPlugin(
  app: FastifyInstance,
  opts: ShutdownPluginOpts
): Promise<void> {
  const signals = opts.signals || ["SIGINT", "SIGTERM"]

  app.decorate("closeAndExitProcess", createCloseAndExitProcess(app))

  const shutdownOnSignal = createShutdownOnSignal(app)
  for (const signal of signals) {
    if (process.listenerCount(signal)) {
      app.log.warn(`Found an existing handler for ${signal}`)
    }
    process.once(signal, shutdownOnSignal)
  }
}

function createCloseAndExitProcess(app: FastifyInstance) {
  return function closeAndExitProcess(processExitCode: number): void {
    app.log.info(
      "Closing resources and exit process with code %d",
      processExitCode
    )
    app.close(() => {
      app.log.info("Closing finished")
      process.exit(processExitCode)
    })
  }
}

function createShutdownOnSignal(app: FastifyInstance): NodeJS.SignalsListener {
  return function shutdownOnSignal(signal): void {
    app.log.info("Received signal: %s", signal)
    app.closeAndExitProcess(0)
  }
}

export interface ShutdownPluginOpts {
  signals?: NodeJS.Signals[]
}

declare module "fastify" {
  interface FastifyInstance {
    closeAndExitProcess: ReturnType<typeof createCloseAndExitProcess>
  }
}
