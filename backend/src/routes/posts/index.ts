import "reflect-metadata";
import { Controller, Get, Post, Put, Delete } from "elysia-decorators";
import { db } from "../../db";
import { posts, postTags, comments, notifications, users, profiles, postVotes, postViews } from "../../db/schema";
import { hasRole } from "../../utils/auth";
import type { UserRoleType } from "../../db/schema";
import { eq, desc, sql, asc, and, not, sum, count } from "drizzle-orm";

@Controller("/posts")
export class PostsController {
    @Get("/", {
        detail: {
            tags: ["Posts"],
            summary: "List all posts",
            description: "Retrieve a list of posts with author and tag information",
        },
    } as any)
    async index({ query, user }: any) {
        const categoryId = query.category ? Number(query.category) : undefined;
        const tagId = query.tagId ? Number(query.tagId) : undefined;
        const sort = query.sort || "recent";
        const currentUser = await user;

        const whereClause = categoryId ? eq(posts.categoryId, categoryId) : undefined;

        let allPostsQuery = db.query.posts.findMany({
            where: whereClause,
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
                category: {
                    columns: {
                        id: true,
                        name: true,
                        slug: true,
                        color: true,
                        icon: true,
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
                postVotes: true,
            },
        });

        let allPosts = await allPostsQuery;

        if (tagId) {
            allPosts = allPosts.filter((post: any) =>
                post.postTags.some((pt: any) => pt.tagId === tagId)
            );
        }

        if (sort === "unanswered") {
            allPosts = await Promise.all(
                allPosts.map(async (post: any) => {
                    const commentCount = await db
                        .select({ count: count() })
                        .from(comments)
                        .where(eq(comments.postId, post.id));

                    return {
                        post,
                        commentCount: commentCount[0]?.count || 0,
                    };
                })
            ).then((results) => results.filter((r) => r.commentCount === 0).map((r) => r.post));
        }

        const allPostsWithComments = await Promise.all(
            allPosts.map(async (post: any) => {
                const commentCount = await db
                    .select({ count: count() })
                    .from(comments)
                    .where(eq(comments.postId, post.id));

                return {
                    ...post,
                    commentCount: commentCount[0]?.count || 0,
                };
            })
        );

        const sortMap: Record<string, (a: any, b: any) => number> = {
            recent: (a, b) => {
                if (a.pinned && !b.pinned) return -1;
                if (!a.pinned && b.pinned) return 1;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            },
            popular: (a, b) => {
                const aVotes = a.postVotes.reduce((sum: number, v: any) => sum + v.value, 0);
                const bVotes = b.postVotes.reduce((sum: number, v: any) => sum + v.value, 0);
                if (a.pinned && !b.pinned) return -1;
                if (!a.pinned && b.pinned) return 1;
                return bVotes - aVotes;
            },
            trending: (a, b) => {
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                const aDate = new Date(a.createdAt);
                const bDate = new Date(b.createdAt);

                const aIsRecent = aDate >= sevenDaysAgo;
                const bIsRecent = bDate >= sevenDaysAgo;

                if (a.pinned && !b.pinned) return -1;
                if (!a.pinned && b.pinned) return 1;
                if (aIsRecent && !bIsRecent) return -1;
                if (!aIsRecent && bIsRecent) return 1;
                if (!aIsRecent && !bIsRecent) return 0;

                const aVotes = a.postVotes.reduce((sum: number, v: any) => sum + v.value, 0);
                const bVotes = b.postVotes.reduce((sum: number, v: any) => sum + v.value, 0);
                return bVotes - aVotes;
            },
            oldest: (a, b) => {
                if (a.pinned && !b.pinned) return -1;
                if (!a.pinned && b.pinned) return 1;
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            },
            "most-replies": (a, b) => {
                if (a.pinned && !b.pinned) return -1;
                if (!a.pinned && b.pinned) return 1;
                return (b.commentCount || 0) - (a.commentCount || 0);
            },
            unanswered: (a, b) => {
                if (a.pinned && !b.pinned) return -1;
                if (!a.pinned && b.pinned) return 1;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            },
        };

        const sortFn = sortMap[sort] || sortMap.recent;
        allPostsWithComments.sort(sortFn);

        const result = allPostsWithComments.map((post: any) => {
            const votes = post.postVotes || [];
            const upvotes = votes.filter((v: any) => v.value === 1).length;
            const downvotes = votes.filter((v: any) => v.value === -1).length;
            const totalVotes = upvotes - downvotes;

            let userVote = 0;
            if (currentUser) {
                const userVoteObj = votes.find((v: any) => v.userId === currentUser.id);
                if (userVoteObj) {
                    userVote = userVoteObj.value;
                }
            }

            return {
                id: post.id,
                title: post.title,
                body: post.body,
                pinned: post.pinned,
                locked: post.locked,
                views: post.views,
                upvotes,
                downvotes,
                totalVotes,
                userVote,
                commentCount: post.commentCount || 0,
                createdAt: post.createdAt,
                updatedAt: post.updatedAt,
                author: {
                    id: post.author.id,
                    email: post.author.email,
                    displayName: post.author.profile?.displayName,
                    username: post.author.profile?.username,
                },
                category: post.category ? {
                    id: post.category.id,
                    name: post.category.name,
                    slug: post.category.slug,
                    color: post.category.color,
                    icon: post.category.icon,
                } : null,
                tags: post.postTags.map((pt: any) => ({
                    id: pt.tag.id,
                    name: pt.tag.name,
                })),
            };
        });

        return result;
    }

    @Post("/", {
        detail: {
            tags: ["Posts"],
            summary: "Create a new post",
            description: "Create a new post with optional tags",
            requestBody: {
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                title: { type: "string" },
                                body: { type: "string" },
                                categoryId: { type: "number" },
                                tagIds: { type: "array", items: { type: "number" } },
                            },
                            required: ["title", "body"],
                        },
                    },
                },
            },
            responses: {
                201: { description: "Post created successfully" },
                401: { description: "Unauthorized" },
            },
        },
    } as any)
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
                categoryId: body.categoryId,
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

    @Get("/:id", {
        detail: {
            tags: ["Posts"],
            summary: "Get a single post",
            description: "Retrieve detailed information about a specific post",
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    schema: { type: "number" },
                    description: "Post ID",
                },
            ],
            responses: {
                200: { description: "Post details" },
                404: { description: "Post not found" },
            },
        },
    } as any)
    async show({ params, set, user }: any) {
        const currentUser = await user;
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
                                username: true,
                            },
                        },
                    },
                },
                category: {
                    columns: {
                        id: true,
                        name: true,
                        slug: true,
                        color: true,
                        icon: true,
                        description: true,
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
                postVotes: true,
            },
        });

        if (!post) {
            set.status = 404;
            return { error: "Post not found" };
        }

        const votes = post.postVotes || [];
        const upvotes = votes.filter((v: any) => v.value === 1).length;
        const downvotes = votes.filter((v: any) => v.value === -1).length;
        const totalVotes = upvotes - downvotes;

        let userVote = 0;
        if (currentUser) {
            const userVoteObj = votes.find((v: any) => v.userId === currentUser.id);
            if (userVoteObj) {
                userVote = userVoteObj.value;
            }
        }

        const author = post.author as any;
        return {
            id: post.id,
            title: post.title,
            body: post.body,
            pinned: post.pinned,
            locked: post.locked,
            views: post.views,
            upvotes,
            downvotes,
            totalVotes,
            userVote,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            author: {
                id: author.id,
                email: author.email,
                displayName: author.profile?.displayName,
                username: author.profile?.username,
            },
            category: post.category ? {
                id: post.category.id,
                name: post.category.name,
                slug: post.category.slug,
                color: post.category.color,
                icon: post.category.icon,
                description: post.category.description,
            } : null,
            tags: post.postTags.map((pt: any) => ({
                id: pt.tag.id,
                name: pt.tag.name,
            })),
        };
    }

    @Post("/:id/views", {
        detail: {
            tags: ["Posts"],
            summary: "Increment post views",
            description: "Increment the view count of a post (only counts unique authenticated users)",
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    schema: { type: "number" },
                    description: "Post ID",
                },
            ],
            responses: {
                200: { description: "Views incremented" },
                401: { description: "Unauthorized" },
            },
        },
    } as any)
    async incrementViews({ params, user, set }: any) {
        const currentUser = await user;
        if (!currentUser) {
            set.status = 401;
            return { error: "Unauthorized" };
        }

        const postId = Number(params.id);
        const userId = currentUser.id;

        const existingView = await db.query.postViews.findFirst({
            where: and(
                eq(postViews.postId, postId),
                eq(postViews.userId, userId)
            ),
        });

        if (existingView) {
            return { message: "View already recorded" };
        }

        await db.transaction(async (tx) => {
            await tx.insert(postViews).values({
                postId,
                userId,
            });

            await tx
                .update(posts)
                .set({
                    views: sql`${posts.views} + 1`,
                })
                .where(eq(posts.id, postId));
        });

        return { message: "View recorded" };
    }

    @Put("/:id", {
        detail: {
            tags: ["Posts"],
            summary: "Update a post",
            description: "Update an existing post (owner or moderator only)",
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    schema: { type: "number" },
                    description: "Post ID",
                },
            ],
            requestBody: {
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                title: { type: "string" },
                                body: { type: "string" },
                                categoryId: { type: "number" },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: "Post updated" },
                401: { description: "Unauthorized" },
                403: { description: "Forbidden" },
                404: { description: "Post not found" },
            },
        },
    } as any)
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
                ...(body.categoryId !== undefined && { categoryId: body.categoryId }),
                updatedAt: new Date(),
            })
            .where(eq(posts.id, Number(params.id)));

        return { message: "Post updated" };
    }

    @Delete("/:id", {
        detail: {
            tags: ["Posts"],
            summary: "Delete a post",
            description: "Delete a post (owner or moderator only)",
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    schema: { type: "number" },
                    description: "Post ID",
                },
            ],
            responses: {
                200: { description: "Post deleted" },
                401: { description: "Unauthorized" },
                403: { description: "Forbidden" },
                404: { description: "Post not found" },
            },
        },
    } as any)
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

    @Post("/:id/pin", {
        detail: {
            tags: ["Posts"],
            summary: "Toggle pin status",
            description: "Pin or unpin a post (moderator only)",
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    schema: { type: "number" },
                    description: "Post ID",
                },
            ],
            responses: {
                200: { description: "Pin status toggled" },
                401: { description: "Unauthorized" },
                403: { description: "Forbidden" },
                404: { description: "Post not found" },
            },
        },
    } as any)
    async togglePin({ params, user, set }: any) {
        const currentUser = await user;
        if (!currentUser) {
            set.status = 401;
            return { error: "Unauthorized" };
        }

        if (!hasRole(currentUser.role as UserRoleType, "MODERATOR")) {
            set.status = 403;
            return { error: "Moderator access required" };
        }

        const post = await db.query.posts.findFirst({
            where: eq(posts.id, Number(params.id)),
        });

        if (!post) {
            set.status = 404;
            return { error: "Post not found" };
        }

        const newPinnedStatus = !post.pinned;

        await db
            .update(posts)
            .set({ pinned: newPinnedStatus })
            .where(eq(posts.id, Number(params.id)));

        if (newPinnedStatus) {
            const allUsers = await db.select({ id: users.id }).from(users);
            const authorName = post.title;

            await db.insert(notifications).values(
                allUsers.map((u) => ({
                    userId: u.id,
                    type: "post_pinned",
                    title: "Post Pinned",
                    body: `A new post has been pinned: "${authorName}"`,
                    postId: post.id,
                    read: false,
                    createdAt: new Date(),
                }))
            );
        }

        return { message: newPinnedStatus ? "Post pinned" : "Post unpinned", pinned: newPinnedStatus };
    }

    @Post("/:id/lock", {
        detail: {
            tags: ["Posts"],
            summary: "Toggle lock status",
            description: "Lock or unlock a post to prevent new comments (moderator only)",
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    schema: { type: "number" },
                    description: "Post ID",
                },
            ],
            responses: {
                200: { description: "Lock status toggled" },
                401: { description: "Unauthorized" },
                403: { description: "Forbidden" },
                404: { description: "Post not found" },
            },
        },
    } as any)
    async toggleLock({ params, user, set }: any) {
        const currentUser = await user;
        if (!currentUser) {
            set.status = 401;
            return { error: "Unauthorized" };
        }

        if (!hasRole(currentUser.role as UserRoleType, "MODERATOR")) {
            set.status = 403;
            return { error: "Moderator access required" };
        }

        const post = await db.query.posts.findFirst({
            where: eq(posts.id, Number(params.id)),
        });

        if (!post) {
            set.status = 404;
            return { error: "Post not found" };
        }

        await db
            .update(posts)
            .set({ locked: !post.locked })
            .where(eq(posts.id, Number(params.id)));

        return { message: post.locked ? "Post unlocked" : "Post locked" };
    }

    @Post("/:id/comments", {
        detail: {
            tags: ["Posts", "Comments"],
            summary: "Create comment on post",
            description: "Add a comment to a post",
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    schema: { type: "number" },
                    description: "Post ID",
                },
            ],
            requestBody: {
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                body: { type: "string" },
                                parentId: { type: "number", description: "Parent comment ID for replies" },
                            },
                            required: ["body"],
                        },
                    },
                },
            },
            responses: {
                201: { description: "Comment created" },
                401: { description: "Unauthorized" },
                403: { description: "Post is locked" },
                404: { description: "Post not found" },
            },
        },
    } as any)
    async createComment({ params, body, user, set }: any) {
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

        if (post.locked && !hasRole(currentUser.role as UserRoleType, "MODERATOR")) {
            set.status = 403;
            return { error: "Post is locked" };
        }

        const result = await db
            .insert(comments)
            .values({
                postId: post.id,
                authorId: currentUser.id,
                parentId: body.parentId || null,
                body: body.body,
            })
            .returning();

        if (!result || result.length === 0) {
            set.status = 500;
            return { error: "Failed to create comment" };
        }

        const newComment = result[0];

        const currentUserProfile = await db.query.profiles.findFirst({
            where: eq(profiles.userId, currentUser.id),
        });

        if (post.authorId !== currentUser.id) {
            await db.insert(notifications).values({
                userId: post.authorId,
                type: "comment",
                title: "New Comment",
                body: `${currentUserProfile?.displayName || "Someone"} commented on your post "${post.title}"`,
                postId: post.id,
                actorUserId: currentUser.id,
                read: false,
                createdAt: new Date(),
            });
        }

        if (body.parentId) {
            const parentComment = await db.query.comments.findFirst({
                where: eq(comments.id, body.parentId),
            });

            if (parentComment && parentComment.authorId !== currentUser.id) {
                const currentUserProfile = await db.query.profiles.findFirst({
                    where: eq(profiles.userId, currentUser.id),
                });

                await db.insert(notifications).values({
                    userId: parentComment.authorId,
                    type: "reply",
                    title: "New Reply",
                    body: `${currentUserProfile?.displayName || "Someone"} replied to your comment`,
                    postId: post.id,
                    actorUserId: currentUser.id,
                    read: false,
                    createdAt: new Date(),
                });
            }
        }

        const mentionRegex = /@(\w+)/g;
        const mentions = body.body.match(mentionRegex);
        if (mentions) {
            const usernames = mentions.map((m: string) => m.substring(1));
            const currentUserProfile = await db.query.profiles.findFirst({
                where: eq(profiles.userId, currentUser.id),
            });

            for (const username of usernames) {
                const mentionedProfile = await db.query.profiles.findFirst({
                    where: eq(profiles.username, username),
                });

                if (mentionedProfile && mentionedProfile.userId !== currentUser.id) {
                    await db.insert(notifications).values({
                        userId: mentionedProfile.userId,
                        type: "mention",
                        title: "You were mentioned",
                        body: `${currentUserProfile?.displayName || "Someone"} mentioned you in a comment on "${post.title}"`,
                        postId: post.id,
                        actorUserId: currentUser.id,
                        read: false,
                        createdAt: new Date(),
                    });
                }
            }
        }

        set.status = 201;
        return { message: "Comment created", id: newComment.id };
    }

    @Post("/:id/upvote", {
        detail: {
            tags: ["Posts"],
            summary: "Upvote a post",
            description: "Upvote a post (authenticated users only)",
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    schema: { type: "number" },
                    description: "Post ID",
                },
            ],
            responses: {
                200: { description: "Vote recorded" },
                401: { description: "Unauthorized" },
                404: { description: "Post not found" },
            },
        },
    } as any)
    async upvote({ params, user, set }: any) {
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

        const existingVote = await db.query.postVotes.findFirst({
            where: and(
                eq(postVotes.postId, Number(params.id)),
                eq(postVotes.userId, currentUser.id)
            ),
        });

        if (existingVote) {
            if (existingVote.value === 1) {
                await db.delete(postVotes).where(
                    and(
                        eq(postVotes.postId, Number(params.id)),
                        eq(postVotes.userId, currentUser.id)
                    )
                );
                return { message: "Upvote removed" };
            } else {
                await db.update(postVotes)
                    .set({ value: 1 })
                    .where(
                        and(
                            eq(postVotes.postId, Number(params.id)),
                            eq(postVotes.userId, currentUser.id)
                        )
                    );
                return { message: "Changed to upvote" };
            }
        }

        await db.insert(postVotes).values({
            postId: Number(params.id),
            userId: currentUser.id,
            value: 1,
        });

        if (post.authorId !== currentUser.id) {
            const currentUserProfile = await db.query.profiles.findFirst({
                where: eq(profiles.userId, currentUser.id),
            });

            await db.insert(notifications).values({
                userId: post.authorId,
                type: "like",
                title: "Post Liked",
                body: `${currentUserProfile?.displayName || "Someone"} liked your post "${post.title}"`,
                postId: post.id,
                actorUserId: currentUser.id,
                read: false,
                createdAt: new Date(),
            });
        }

        return { message: "Upvoted" };
    }

    @Post("/:id/downvote", {
        detail: {
            tags: ["Posts"],
            summary: "Downvote a post",
            description: "Downvote a post (authenticated users only)",
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    schema: { type: "number" },
                    description: "Post ID",
                },
            ],
            responses: {
                200: { description: "Vote recorded" },
                401: { description: "Unauthorized" },
                404: { description: "Post not found" },
            },
        },
    } as any)
    async downvote({ params, user, set }: any) {
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

        const existingVote = await db.query.postVotes.findFirst({
            where: and(
                eq(postVotes.postId, Number(params.id)),
                eq(postVotes.userId, currentUser.id)
            ),
        });

        if (existingVote) {
            if (existingVote.value === -1) {
                await db.delete(postVotes).where(
                    and(
                        eq(postVotes.postId, Number(params.id)),
                        eq(postVotes.userId, currentUser.id)
                    )
                );
                return { message: "Downvote removed" };
            } else {
                await db.update(postVotes)
                    .set({ value: -1 })
                    .where(
                        and(
                            eq(postVotes.postId, Number(params.id)),
                            eq(postVotes.userId, currentUser.id)
                        )
                    );
                return { message: "Changed to downvote" };
            }
        }

        await db.insert(postVotes).values({
            postId: Number(params.id),
            userId: currentUser.id,
            value: -1,
        });

        return { message: "Downvoted" };
    }
}
