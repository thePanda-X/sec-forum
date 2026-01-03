import "reflect-metadata";
import "reflect-metadata";
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { decorators } from "elysia-decorators";
import { config } from "dotenv";
import { join } from "path";

config({ path: join(process.cwd(), "../.env") });

await import("./db/migrate");

config({ path: join(process.cwd(), "../.env") });

import { UsersController } from "./routes/users";
import { PostsController } from "./routes/posts";
import { TagsController } from "./routes/tags";
import { AuthController } from "./routes/auth";
import { CommentsController } from "./routes/comments";
import { NotificationsController } from "./routes/notifications";
import { SettingsController } from "./routes/settings";
import { ReportsController } from "./routes/reports";
import { AdminController } from "./routes/admin";
import { CategoriesController, StatsController } from "./routes/categories";
import { UsersController as ProfileController } from "./routes/users/profile";
import { authPlugin } from "./middleware/auth";
import { logger } from "./utils/logger";

logger.info("Starting SEC Forum API...", { level: process.env.LOG_LEVEL || "DEBUG" });

type RequestWithLog = Request & { _logStart?: number };

const app = new Elysia({ prefix: "/api/v1" })
    .use(cors())
    .use(swagger({ path: "/docs" }))
    .use(authPlugin)
    .use(
        decorators({
            controllers: [
                UsersController,
                PostsController,
                TagsController,
                AuthController,
                CommentsController,
                NotificationsController,
                SettingsController,
                ReportsController,
                AdminController,
                CategoriesController,
                StatsController,
                ProfileController,
            ],
        })
    )
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
    .get("/", () => ({
        message: "SEC Forum API",
        docs: "/docs",
    }))
    .listen(Number(process.env.PORT) || 3000, ({ hostname, port }) => {
        logger.info(`Server running at http://${hostname}:${port}`);
    });

export type App = typeof app;
