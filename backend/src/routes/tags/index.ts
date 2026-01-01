import "reflect-metadata";
import { Controller, Get, Post } from "elysia-decorators";
import { db } from "../../db";
import { tags } from "../../db/schema";
import { hasRole } from "../../utils/auth";
import { eq } from "drizzle-orm";

@Controller("/tags")
export class TagsController {
  @Get("/")
  async index() {
    const allTags = await db.query.tags.findMany({
      orderBy: [tags.name],
    });
    return allTags;
  }

  @Post("/")
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
