import http from "http"
import fastify from "fastify"

export type Request<
  Query = fastify.DefaultQuery,
  Params = fastify.DefaultParams,
  Headers = fastify.DefaultHeaders,
  Body = unknown
> = fastify.FastifyRequest<http.IncomingMessage, Query, Params, Headers, Body>

export type Response = fastify.FastifyReply<http.ServerResponse>

export type RequestHandler<
  Query = fastify.DefaultQuery,
  Params = fastify.DefaultParams,
  Headers = fastify.DefaultHeaders,
  Body = fastify.DefaultBody
> = fastify.RequestHandler<
  http.IncomingMessage,
  http.ServerResponse,
  Query,
  Params,
  Headers,
  Body
>

export type RouteOptions<
  Query = fastify.DefaultQuery,
  Params = fastify.DefaultParams,
  Headers = fastify.DefaultHeaders,
  Body = fastify.DefaultBody
> = fastify.RouteOptions<
  http.Server,
  http.IncomingMessage,
  http.ServerResponse,
  Query,
  Params,
  Headers,
  Body
>
