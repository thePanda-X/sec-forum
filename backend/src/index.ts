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
await import("./db/auto-seed").then((m) => m.autoSeed());

// Initialize S3 bucket
import { initializeS3Bucket } from "./services/s3";
try {
  await initializeS3Bucket();
} catch (error) {
  console.error("Warning: Failed to initialize S3 bucket. File uploads may not work.", error);
}

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
import { UploadsController } from "./routes/uploads";
import { authPlugin } from "./middleware/auth";
import { loggingPlugin } from "./middleware/logging";
import { logger } from "./utils/logger";

logger.info("Starting SEC Forum API...", { level: process.env.LOG_LEVEL || "DEBUG" });

const app = new Elysia({ prefix: "/api/v1" })
    .use(cors())
    .use(swagger({ path: "/docs" }))
    .use(loggingPlugin)
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
                UploadsController,
            ],
        })
    )
    .get("/", ({ request }: { request: Request }) => {
        console.log("=== ROOT HANDLER CALLED ===", request.url);
        return {
            message: "SEC Forum API",
            docs: "/docs",
        };
    })
    .listen(Number(process.env.PORT) || 3000, ({ hostname, port }) => {
        logger.info(`Server running at http://${hostname}:${port}`);
    });

export type App = typeof app;
