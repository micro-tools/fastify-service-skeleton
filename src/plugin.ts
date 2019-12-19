import http from 'http'
import fastify from 'fastify'
// import fastifyPlugin from 'fastify-plugin'

export type Plugin<
  Options extends {},
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
