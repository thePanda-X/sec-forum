import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { config } from "dotenv";
import { join } from "path";

config({ path: join(process.cwd(), "../.env") });

import { usersRoutes } from "./routes/users";
import { postsRoutes } from "./routes/posts";
import { tagsRoutes } from "./routes/tags";
import { authPlugin } from "./middleware/auth";
import { logger } from "./utils/logger";

logger.info("Starting SEC Forum API...", { level: process.env.LOG_LEVEL || "INFO" });

type RequestWithLog = Request & { _logStart?: number };

const app = new Elysia()
  .use(cors())
  .use(swagger({ path: "/docs" }))
  .onStart((app) => {
    const request = (app as { request?: Request }).request;
    if (request) {
      const url = new URL(request.url);
      (request as RequestWithLog)._logStart = performance.now();
      logger.debug(`→ ${request.method} ${url.pathname}${url.search}`);
    }
  })
  .onAfterHandle((app) => {
    const request = (app as { request?: Request }).request;
    const set = (app as { set?: { status?: number | string } }).set;
    if (request && set) {
      const req = request as RequestWithLog;
      if (req._logStart) {
        const duration = performance.now() - req._logStart;
        const statusCode = typeof set.status === "number" ? set.status : undefined;
        logger.logRequest(request.method, new URL(request.url).pathname, statusCode, duration);
      }
    }
  })
  .onError((app) => {
    const request = (app as { request?: Request }).request;
    const error = (app as { error?: unknown }).error;
    const set = (app as { set?: { status?: number | string } }).set;
    if (request && error && set) {
      const req = request as RequestWithLog;
      const duration = req._logStart ? `${Math.round(performance.now() - req._logStart)}ms` : "N/A";
      const errorMessage = typeof error === "object" && error && "message" in error ? String(error.message) : String(error);
      logger.error(`✗ ${request.method} ${new URL(request.url).pathname} - ${errorMessage}`, {
        method: request.method,
        path: new URL(request.url).pathname,
        status: set.status,
        duration,
        error: errorMessage,
      });
    }
  })
  .use(authPlugin)
  .use(usersRoutes)
  .use(postsRoutes)
  .use(tagsRoutes)
  .get("/", () => ({
    message: "SEC Forum API",
    docs: "/docs",
  }))
  .listen(Number(process.env.PORT) || 3000, ({ hostname, port }) => {
    logger.info(`Server running at http://${hostname}:${port}`);
  });

export type App = typeof app;
