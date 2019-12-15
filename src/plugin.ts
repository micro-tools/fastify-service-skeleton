import http from 'http'
import fastify from 'fastify'
// import fastifyPlugin from 'fastify-plugin'

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

export function createPlugin<
  Options,
  PluginInstance extends Function = Function,
  HttpServer = http.Server,
  HttpRequest = http.IncomingMessage,
  HttpResponse = http.ServerResponse
>(
  pluginFunc: fastify.Plugin<
    HttpServer,
    HttpRequest,
    HttpResponse,
    Options,
    PluginInstance
  >,
  // global = false,
): fastify.Plugin<
  HttpServer,
  HttpRequest,
  HttpResponse,
  Options,
  PluginInstance
> {
  // if (global) {
  //   return fastifyPlugin(pluginFunc);
  // }
  return pluginFunc
}
