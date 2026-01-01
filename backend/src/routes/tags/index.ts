import "reflect-metadata";
import { Controller, Get, Post } from "elysia-decorators";
import { db } from "../../db";
import { tags } from "../../db/schema";
import { hasRole } from "../../utils/auth";
import { eq } from "drizzle-orm";

@Controller("/tags")
export class TagsController {
  @Get("/", {
    detail: {
      tags: ["Tags"],
      summary: "List all tags",
      description: "Retrieve a list of all tags",
      responses: {
        200: { description: "List of tags" },
      },
    },
  } as any)
  async index() {
    const allTags = await db.query.tags.findMany({
      orderBy: [tags.name],
    });
    return allTags;
  }

  @Post("/", {
    detail: {
      tags: ["Tags"],
      summary: "Create tag",
      description: "Create a new tag (admin only)",
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
              },
              required: ["name"],
            },
          },
        },
      },
      responses: {
        201: { description: "Tag created" },
        401: { description: "Unauthorized" },
        403: { description: "Admin access required" },
        409: { description: "Tag already exists" },
      },
    },
  } as any)
  async create({ body, user, set }: any) {
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
  }
}
