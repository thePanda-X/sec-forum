import "reflect-metadata";
import { Controller, Get, Post, Put, Delete } from "elysia-decorators";
import { db } from "../../db";
import { comments, posts } from "../../db/schema";
import { hasRole } from "../../utils/auth";
import type { UserRoleType } from "../../db/schema";
import { eq, desc, asc } from "drizzle-orm";

@Controller("/comments")
export class CommentsController {
  @Get("/post/:postId", {
    detail: {
      tags: ["Comments"],
      summary: "Get comments for a post",
      description: "Retrieve all comments for a specific post",
      parameters: [
        {
          name: "postId",
          in: "path",
          required: true,
          schema: { type: "number" },
          description: "Post ID",
        },
      ],
      responses: {
        200: { description: "Comments list" },
        404: { description: "Post not found" },
      },
    },
  } as any)
  async forPost({ params, set }: any) {
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, Number(params.postId)),
    });

    if (!post) {
      set.status = 404;
      return { error: "Post not found" };
    }

    const allComments = await db.query.comments.findMany({
      where: eq(comments.postId, Number(params.postId)),
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
                username: true,
              },
            },
          },
        },
      },
      orderBy: [asc(comments.createdAt)],
    });

    return allComments.map((comment: any) => ({
      id: comment.id,
      body: comment.body,
      parentId: comment.parentId,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author: {
        id: comment.author.id,
        email: comment.author.email,
        displayName: comment.author.profile?.displayName,
        username: comment.author.profile?.username,
      },
    }));
  }

  @Get("/:id", {
    detail: {
      tags: ["Comments"],
      summary: "Get a comment",
      description: "Retrieve detailed information about a specific comment",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "number" },
          description: "Comment ID",
        },
      ],
      responses: {
        200: { description: "Comment details" },
        404: { description: "Comment not found" },
      },
    },
  } as any)
  async show({ params, set }: any) {
    const comment = await db.query.comments.findFirst({
      where: eq(comments.id, Number(params.id)),
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
        post: {
          columns: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!comment) {
      set.status = 404;
      return { error: "Comment not found" };
    }

    return {
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author: {
        id: comment.author.id,
        email: comment.author.email,
        displayName: comment.author.profile?.displayName,
      },
      post: {
        id: comment.post.id,
        title: comment.post.title,
      },
    };
  }

  @Put("/:id", {
    detail: {
      tags: ["Comments"],
      summary: "Update a comment",
      description: "Update an existing comment (owner or moderator only)",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "number" },
          description: "Comment ID",
        },
      ],
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                body: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Comment updated" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
        404: { description: "Comment not found" },
      },
    },
  } as any)
  async update({ params, body, user, set }: any) {
    const currentUser = await user;
    if (!currentUser) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const comment = await db.query.comments.findFirst({
      where: eq(comments.id, Number(params.id)),
    });

    if (!comment) {
      set.status = 404;
      return { error: "Comment not found" };
    }

    const isOwner = comment.authorId === currentUser.id;
    const canEdit = isOwner || hasRole(currentUser.role as UserRoleType, "MODERATOR");

    if (!canEdit) {
      set.status = 403;
      return { error: "Forbidden" };
    }

    await db
      .update(comments)
      .set({
        ...(body.body && { body: body.body }),
        updatedAt: new Date(),
      })
      .where(eq(comments.id, Number(params.id)));

    return { message: "Comment updated" };
  }

  @Delete("/:id", {
    detail: {
      tags: ["Comments"],
      summary: "Delete a comment",
      description: "Delete a comment (owner or moderator only)",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "number" },
          description: "Comment ID",
        },
      ],
      responses: {
        200: { description: "Comment deleted" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
        404: { description: "Comment not found" },
      },
    },
  } as any)
  async destroy({ params, user, set }: any) {
    const currentUser = await user;
    if (!currentUser) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const comment = await db.query.comments.findFirst({
      where: eq(comments.id, Number(params.id)),
    });

    if (!comment) {
      set.status = 404;
      return { error: "Comment not found" };
    }

    const isOwner = comment.authorId === currentUser.id;
    const canDelete = isOwner || hasRole(currentUser.role as UserRoleType, "MODERATOR");

    if (!canDelete) {
      set.status = 403;
      return { error: "Forbidden" };
    }

    await db.delete(comments).where(eq(comments.id, Number(params.id)));

    return { message: "Comment deleted" };
  }
}
