import "reflect-metadata";
import { Controller, Get, Post } from "elysia-decorators";
import { db } from "../../db";
import { categories, posts, postTags, tags, comments, users, profiles } from "../../db/schema";
import { eq, desc, count, sql } from "drizzle-orm";

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
    const [usersCount] = await db.select({ count: count() }).from(users);
    const [commentsCount] = await db.select({ count: count() }).from(comments);
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
        count: postCountsArray.find((pc: any) => pc.tagId === tag.id)?.postCount || 0,
      }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10);

    const topContributors = await db
      .select({
        id: users.id,
        name: profiles.displayName,
        username: profiles.username,
        avatar: profiles.avatar,
        postCount: count(posts.id),
      })
      .from(users)
      .innerJoin(profiles, eq(users.id, profiles.userId))
      .leftJoin(posts, eq(posts.authorId, users.id))
      .groupBy(users.id, profiles.displayName, profiles.username, profiles.avatar)
      .orderBy(desc(count(posts.id)))
      .limit(5);

    const enrichedContributors = topContributors.map((c: any, index: number) => ({
      id: String(c.id),
      name: c.name || c.username || "Unknown",
      username: c.username,
      avatar: c.avatar,
      reputation: Math.floor(c.postCount * 10),
      posts: c.postCount || 0,
      rank: index + 1,
    }));

    return {
      totalPosts: postsCount?.count || 0,
      members: usersCount?.count || 0,
      totalReplies: commentsCount?.count || 0,
      onlineNow: 0,
      trendingTags,
      topContributors: enrichedContributors,
    };
  }
}
