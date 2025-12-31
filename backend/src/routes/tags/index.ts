import { Elysia, t } from "elysia";
import { db } from "../../db";
import { tags } from "../../db/schema";
import { authPlugin } from "../../middleware/auth";
import { hasRole } from "../../utils/auth";
import { eq } from "drizzle-orm";

const CreateTagSchema = t.Object({
  name: t.String({ minLength: 1, maxLength: 30 }),
});

export const tagsRoutes = (app: Elysia) =>
  app
    .use(authPlugin)
    .group("/tags", (app) =>
      app
        .get("/", async () => {
          const allTags = await db.query.tags.findMany({
            orderBy: [tags.name],
          });
          return allTags;
        })
        .post(
          "/",
          async ({ body, user, set }) => {
            const currentUser = await user;
            if (!currentUser) {
              set.status = 401;
              return { error: "Unauthorized" };
            }

            if (!hasRole(currentUser.role, "ADMIN")) {
              set.status = 403;
              return { error: "Admin access required" };
            }

            const existingTag = await db.query.tags.findFirst({
              where: eq(tags.name, body.name),
            });

            if (existingTag) {
              set.status = 409;
              return { error: "Tag already exists" };
            }

            const [tag] = await db.insert(tags).values({ name: body.name }).returning();

            set.status = 201;
            return { message: "Tag created", tag };
          },
          { body: CreateTagSchema }
        )
    );
