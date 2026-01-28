import { Elysia } from "elysia";
import { logger } from "../utils/logger";

type RequestWithLog = Request & { _logStart?: number };

export const loggingPlugin = (app: Elysia) =>
  app
    .onRequest(({ request }) => {
      const url = new URL(request.url);
      (request as RequestWithLog)._logStart = performance.now();
      const queryParams: Record<string, unknown> = {};
      url.searchParams.forEach((value, key) => {
        queryParams[key] = value;
      });
      console.log(`[LOGGING] onRequest: ${request.method} ${url.pathname}`);
      logger.logRequest(request.method, url.pathname, undefined, undefined, undefined, queryParams);
    })
    .onAfterHandle(({ request, set, response }) => {
      const req = request as RequestWithLog;
      const url = new URL(request.url);
      const duration = req._logStart ? performance.now() - req._logStart : 0;
      const statusCode = set?.status != null && typeof set.status === "number" ? set.status : 200;
      const queryParams: Record<string, unknown> = {};
      url.searchParams.forEach((value, key) => {
        queryParams[key] = value;
      });
      console.log(`[LOGGING] onAfterHandle: ${request.method} ${url.pathname} - status=${statusCode} duration=${duration.toFixed(2)}ms setStatus=${set?.status} response=${JSON.stringify(response).substring(0, 50)}`);
      logger.logRequest(request.method, url.pathname, statusCode, duration, undefined, queryParams);
      return response;
    })
    .onError(({ request, error, set }) => {
      const req = request as RequestWithLog;
      const duration = req._logStart ? `${Math.round(performance.now() - req._logStart)}ms` : "N/A";
      const errorMessage =
        typeof error === "object" && error && "message" in error
          ? String(error.message)
          : String(error);
      let stack: string | undefined;
      if (
        typeof error === "object" &&
        error &&
        "stack" in error &&
        typeof error.stack === "string"
      ) {
        stack = error.stack;
      }
      const url = new URL(request.url);
      const statusCode = set?.status != null && typeof set.status === "number" ? set.status : 500;
      console.log(`[LOGGING] onError: ${request.method} ${url.pathname} - status=${statusCode} duration=${duration} error=${errorMessage} stackLen=${stack?.length || 0}`);
      logger.logErrorWithStack(
        request.method,
        url.pathname,
        errorMessage,
        stack,
        statusCode,
        duration
      );
    });
