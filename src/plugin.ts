import http from "http"
import fastify from "fastify"

export type Plugin<
  Options,
  PluginInstance extends Function = Function,
  HttpServer = http.Server,
  HttpRequest = http.IncomingMessage,
  HttpResponse = http.ServerResponse
> = fastify.Plugin<
  HttpServer,
  HttpRequest,
  HttpResponse,
  Options,
  PluginInstance
>
