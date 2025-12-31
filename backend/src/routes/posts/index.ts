import { Elysia, t } from "elysia";
import { db } from "../../db";
import { posts, postTags } from "../../db/schema";
import { authPlugin } from "../../middleware/auth";
import { hasRole } from "../../utils/auth";
import type { UserRoleType } from "../../db/schema";
import { eq, desc } from "drizzle-orm";

const CreatePostSchema = t.Object({
  title: t.String({ minLength: 1, maxLength: 200 }),
  body: t.String({ minLength: 1 }),
  tagIds: t.Optional(t.Array(t.Number())),
});

const UpdatePostSchema = t.Object({
  title: t.Optional(t.String({ minLength: 1, maxLength: 200 })),
  body: t.Optional(t.String({ minLength: 1 })),
});

export const postsRoutes = (app: Elysia) =>
  app
    .use(authPlugin)
    .group("/posts", (app) =>
      app
        .get("/", async () => {
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

          return allPosts.map((post) => ({
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
            tags: post.postTags.map((pt) => ({
              id: pt.tag.id,
              name: pt.tag.name,
            })),
          }));
        })
        .post(
          "/",
          async ({ body, user, set }) => {
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
          },
          { body: CreatePostSchema }
        )
        .get(
          "/:id",
          async ({ params }) => {
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
              tags: post.postTags.map((pt) => ({
                id: pt.tag.id,
                name: pt.tag.name,
              })),
            };
          }
        )
        .put(
          "/:id",
          async ({ params, body, user, set }) => {
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
          },
          { body: UpdatePostSchema }
        )
        .delete(
          "/:id",
          async ({ params, user, set }) => {
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
        )
    );
