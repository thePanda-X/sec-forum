import "reflect-metadata";
import { Controller, Get, Post } from "elysia-decorators";
import { db } from "../../db";
import { categories, posts, postTags, tags } from "../../db/schema";
import { eq, desc, count } from "drizzle-orm";

@Controller("/categories")
export class CategoriesController {
  @Get("/", {
    detail: {
      tags: ["Categories"],
      summary: "List categories",
      description: "Retrieve all categories",
      responses: {
        200: { description: "List of categories" },
      },
    },
  } as any)
  async index() {
    const allCategories = await db.query.categories.findMany({
      orderBy: [desc(categories.createdAt)],
    });

    return allCategories;
  }
}

@Controller("/stats")
export class StatsController {
  @Get("/forum", {
    detail: {
      tags: ["Stats"],
      summary: "Forum statistics",
      description: "Get forum statistics including trending tags",
      responses: {
        200: { description: "Forum stats" },
      },
    },
  } as any)
  async forumStats() {
    const [postsCount] = await db.select({ count: count() }).from(posts);
    const [tagsCount] = await db.select({ count: count() }).from(tags);

    const postCounts = await db
      .select({
        tagId: postTags.tagId,
        postCount: count(postTags.postId),
      })
      .from(postTags)
      .groupBy(postTags.tagId);

    const tagsWithCounts = await db.query.tags.findMany({
      orderBy: [desc(tags.name)],
    });

    const postCountsArray = Array.isArray(postCounts) ? postCounts : [];
    const tagsArray = Array.isArray(tagsWithCounts) ? tagsWithCounts : [];

    const trendingTags = tagsArray
      .map((tag: any) => ({
        id: tag.id,
        name: tag.name,
        postCount: postCountsArray.find((pc: any) => pc.tagId === tag.id)?.postCount || 0,
      }))
      .sort((a: any, b: any) => b.postCount - a.postCount)
      .slice(0, 10);

    return {
      postsCount: postsCount?.count || 0,
      tagsCount: tagsCount?.count || 0,
      trendingTags,
    };
  }
}
