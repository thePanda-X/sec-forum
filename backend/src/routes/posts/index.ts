import "reflect-metadata";
import { Controller, Get, Post, Put, Delete } from "elysia-decorators";
import { db } from "../../db";
import { posts, postTags } from "../../db/schema";
import { hasRole } from "../../utils/auth";
import type { UserRoleType } from "../../db/schema";
import { eq, desc } from "drizzle-orm";

@Controller("/posts")
export class PostsController {
  @Get("/")
  async index() {
    const allPosts = await db.query.posts.findMany({
      with: {
        author: {
          columns: {
            id: true,
            email: true,
          },
          with: {
            profile: {
              columns: {
                displayName: true,
              },
            },
          },
        },
        postTags: {
          with: {
            tag: {
              columns: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [desc(posts.createdAt)],
    });

    return allPosts.map((post: any) => ({
      id: post.id,
      title: post.title,
      body: post.body,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: {
        id: post.author.id,
        email: post.author.email,
        displayName: post.author.profile?.displayName,
      },
      tags: post.postTags.map((pt: any) => ({
        id: pt.tag.id,
        name: pt.tag.name,
      })),
    }));
  }

  @Post("/")
  async create({ body, user, set }: any) {
    const currentUser = await user;
    if (!currentUser) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const [post] = await db
      .insert(posts)
      .values({
        authorId: currentUser.id,
        title: body.title,
        body: body.body,
      })
      .returning({ id: posts.id });

    if (body.tagIds && body.tagIds.length > 0) {
      await db.insert(postTags).values(
        body.tagIds.map((tagId: number) => ({
          postId: post.id,
          tagId,
        }))
      );
    }

    set.status = 201;
    return { message: "Post created", id: post.id };
  }

  @Get("/:id")
  async show({ params, set }: any) {
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, Number(params.id)),
      with: {
        author: {
          columns: {
            id: true,
            email: true,
          },
          with: {
            profile: {
              columns: {
                displayName: true,
              },
            },
          },
        },
        postTags: {
          with: {
            tag: {
              columns: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!post) {
      set.status = 404;
      return { error: "Post not found" };
    }

    return {
      id: post.id,
      title: post.title,
      body: post.body,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: {
        id: post.author.id,
        email: post.author.email,
        displayName: post.author.profile?.displayName,
      },
      tags: post.postTags.map((pt: any) => ({
        id: pt.tag.id,
        name: pt.tag.name,
      })),
    };
  }

  @Put("/:id")
  async update({ params, body, user, set }: any) {
    const currentUser = await user;
    if (!currentUser) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const post = await db.query.posts.findFirst({
      where: eq(posts.id, Number(params.id)),
    });

    if (!post) {
      set.status = 404;
      return { error: "Post not found" };
    }

    const isOwner = post.authorId === currentUser.id;
    const canEdit = isOwner || hasRole(currentUser.role as UserRoleType, "MODERATOR");

    if (!canEdit) {
      set.status = 403;
      return { error: "Forbidden" };
    }

    await db
      .update(posts)
      .set({
        ...(body.title && { title: body.title }),
        ...(body.body && { body: body.body }),
        updatedAt: new Date(),
      })
      .where(eq(posts.id, Number(params.id)));

    return { message: "Post updated" };
  }

  @Delete("/:id")
  async destroy({ params, user, set }: any) {
    const currentUser = await user;
    if (!currentUser) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const post = await db.query.posts.findFirst({
      where: eq(posts.id, Number(params.id)),
    });

    if (!post) {
      set.status = 404;
      return { error: "Post not found" };
    }

    const isOwner = post.authorId === currentUser.id;
    const canDelete = isOwner || hasRole(currentUser.role as UserRoleType, "MODERATOR");

    if (!canDelete) {
      set.status = 403;
      return { error: "Forbidden" };
    }

    await db.delete(posts).where(eq(posts.id, Number(params.id)));

    return { message: "Post deleted" };
  }
}
