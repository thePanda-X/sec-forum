import "reflect-metadata";
import { Controller, Get, Put, Post, Delete } from "elysia-decorators";
import { db } from "../../db";
import { users, profiles, userSettings, followers, posts, notifications } from "../../db/schema";
import { hasRole, hashPassword, verifyPassword } from "../../utils/auth";
import type { UserRoleType } from "../../db/schema";
import { eq, desc } from "drizzle-orm";

@Controller("/users/:username")
export class UsersController {
  @Get("/", {
    detail: {
      tags: ["Users"],
      summary: "Get user profile",
      description: "Retrieve user profile by username",
      parameters: [
        {
          name: "username",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Username",
        },
      ],
      responses: {
        200: { description: "User profile" },
        404: { description: "User not found" },
      },
    },
  } as any)
  async show({ params, set }: any) {
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.username, params.username),
      with: {
        user: {
          columns: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    if (!profile) {
      set.status = 404;
      return { error: "User not found" };
    }

    const allFollowers = await db.query.followers.findMany();
    const followersCount = allFollowers.filter(
      (f: any) => f.followingId === profile.userId
    ).length;
    const followingCount = allFollowers.filter(
      (f: any) => f.followerId === profile.userId
    ).length;

    const user = profile.user as any;

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: profile.displayName,
      username: profile.username,
      avatar: profile.avatar,
      bio: profile.bio,
      location: profile.location,
      website: profile.website,
      githubUsername: profile.githubUsername,
      twitterHandle: profile.twitterHandle,
      skills: profile.skills,
      createdAt: user.createdAt,
      followersCount,
      followingCount,
    };
  }

  @Get("/posts", {
    detail: {
      tags: ["Users"],
      summary: "Get user's posts",
      description: "Retrieve all posts created by a specific user",
      parameters: [
        {
          name: "username",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Username",
        },
      ],
      responses: {
        200: { description: "List of posts" },
        404: { description: "User not found" },
      },
    },
  } as any)
  async posts({ params, set }: any) {
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.username, params.username),
    });

    if (!profile) {
      set.status = 404;
      return { error: "User not found" };
    }

    const userPosts = await db.query.posts.findMany({
      where: eq(posts.authorId, profile.userId),
      orderBy: [desc(posts.createdAt)],
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

    return userPosts.map((post: any) => ({
      id: post.id,
      title: post.title,
      body: post.body,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: {
        id: post.author.id,
        email: post.author.email,
        displayName: post.author.profile?.displayName,
        username: post.author.profile?.username,
      },
      tags: post.postTags.map((pt: any) => ({
        id: pt.tag.id,
        name: pt.tag.name,
      })),
    }));
  }

  @Put("/", {
    detail: {
      tags: ["Users"],
      summary: "Update profile",
      description: "Update user profile (owner or admin only)",
      parameters: [
        {
          name: "username",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Username",
        },
      ],
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                displayName: { type: "string" },
                avatar: { type: "string" },
                bio: { type: "string" },
                location: { type: "string" },
                website: { type: "string" },
                githubUsername: { type: "string" },
                twitterHandle: { type: "string" },
                skills: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Profile updated" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
        404: { description: "User not found" },
      },
    },
  } as any)
  async update({ params, body, user, set }: any) {
    const currentUser = await user;
    if (!currentUser) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.username, params.username),
    });

    if (!profile) {
      set.status = 404;
      return { error: "User not found" };
    }

    if (profile.userId !== currentUser.id && !hasRole(currentUser.role as UserRoleType, "ADMIN")) {
      set.status = 403;
      return { error: "Forbidden" };
    }

    await db
      .update(profiles)
      .set({
        ...(body.displayName && { displayName: body.displayName }),
        ...(body.avatar && { avatar: body.avatar }),
        ...(body.bio !== undefined && { bio: body.bio }),
        ...(body.location !== undefined && { location: body.location }),
        ...(body.website !== undefined && { website: body.website }),
        ...(body.githubUsername !== undefined && { githubUsername: body.githubUsername }),
        ...(body.twitterHandle !== undefined && { twitterHandle: body.twitterHandle }),
        ...(body.skills !== undefined && { skills: body.skills }),
      })
      .where(eq(profiles.id, profile.id));

    return { message: "Profile updated" };
  }

  @Put("/avatar", {
    detail: {
      tags: ["Users"],
      summary: "Update avatar",
      description: "Update user's avatar image (owner only)",
      parameters: [
        {
          name: "username",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Username",
        },
      ],
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                avatar: { type: "string" },
              },
              required: ["avatar"],
            },
          },
        },
      },
      responses: {
        200: { description: "Avatar updated" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
        404: { description: "User not found" },
      },
    },
  } as any)
  async updateAvatar({ params, body, user, set }: any) {
    const currentUser = await user;
    if (!currentUser) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.username, params.username),
    });

    if (!profile) {
      set.status = 404;
      return { error: "User not found" };
    }

    if (profile.userId !== currentUser.id) {
      set.status = 403;
      return { error: "Forbidden" };
    }

    await db
      .update(profiles)
      .set({ avatar: body.avatar })
      .where(eq(profiles.id, profile.id));

    return { message: "Avatar updated" };
  }

  @Post("/follow", {
    detail: {
      tags: ["Users"],
      summary: "Follow user",
      description: "Follow a specific user",
      parameters: [
        {
          name: "username",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Username to follow",
        },
      ],
      responses: {
        200: { description: "User followed" },
        400: { description: "Cannot follow yourself or already following" },
        401: { description: "Unauthorized" },
        404: { description: "User not found" },
      },
    },
  } as any)
  async follow({ params, user, set }: any) {
    const currentUser = await user;
    if (!currentUser) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.username, params.username),
    });

    if (!profile) {
      set.status = 404;
      return { error: "User not found" };
    }

    if (profile.userId === currentUser.id) {
      set.status = 400;
      return { error: "Cannot follow yourself" };
    }

    const allFollows = await db.query.followers.findMany();
    const existingFollow = allFollows.find(
      (f: any) => f.followerId === currentUser.id && f.followingId === profile.userId
    );

    if (existingFollow) {
      set.status = 400;
      return { error: "Already following this user" };
    }

    await db.insert(followers).values({
      followerId: currentUser.id,
      followingId: profile.userId,
    });

    const currentUserProfile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, currentUser.id),
    });

    await db.insert(notifications).values({
      userId: profile.userId,
      type: "follow",
      title: "New Follower",
      body: `${currentUserProfile?.displayName || "Someone"} started following you`,
      actorUserId: currentUser.id,
    });

    return { message: "User followed" };
  }

  @Delete("/follow", {
    detail: {
      tags: ["Users"],
      summary: "Unfollow user",
      description: "Unfollow a specific user",
      parameters: [
        {
          name: "username",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Username to unfollow",
        },
      ],
      responses: {
        200: { description: "User unfollowed" },
        401: { description: "Unauthorized" },
      },
    },
  } as any)
  async unfollow({ params, user, set }: any) {
    const currentUser = await user;
    if (!currentUser) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.username, params.username),
    });

    if (!profile) {
      set.status = 404;
      return { error: "User not found" };
    }

    const allFollows = await db.query.followers.findMany();
    const followToDelete = allFollows.find(
      (f: any) => f.followerId === currentUser.id && f.followingId === profile.userId
    );

    if (followToDelete) {
      await db.delete(followers).where(eq(followers.followerId, currentUser.id));
    }

    return { message: "User unfollowed" };
  }

  @Get("/followers", {
    detail: {
      tags: ["Users"],
      summary: "Get followers",
      description: "Retrieve list of users following the specified user",
      parameters: [
        {
          name: "username",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Username",
        },
      ],
      responses: {
        200: { description: "List of followers" },
        404: { description: "User not found" },
      },
    },
  } as any)
  async followers({ params, set }: any) {
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.username, params.username),
    });

    if (!profile) {
      set.status = 404;
      return { error: "User not found" };
    }

    const userFollowers = await db.query.followers.findMany({
      where: (table, { eq }) => eq(table.followingId, profile.userId),
      with: {
        follower: {
          columns: {
            id: true,
            email: true,
          },
          with: {
            profile: {
              columns: {
                displayName: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return userFollowers.map((f: any) => ({
      id: f.follower.id,
      email: f.follower.email,
      displayName: f.follower.profile?.displayName,
      username: f.follower.profile?.username,
      avatar: f.follower.profile?.avatar,
    }));
  }

  @Get("/following", {
    detail: {
      tags: ["Users"],
      summary: "Get following",
      description: "Retrieve list of users the specified user is following",
      parameters: [
        {
          name: "username",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Username",
        },
      ],
      responses: {
        200: { description: "List of following" },
        404: { description: "User not found" },
      },
    },
  } as any)
  async following({ params, set }: any) {
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.username, params.username),
    });

    if (!profile) {
      set.status = 404;
      return { error: "User not found" };
    }

    const userFollowing = await db.query.followers.findMany({
      where: (table, { eq }) => eq(table.followerId, profile.userId),
      with: {
        following: {
          columns: {
            id: true,
            email: true,
          },
          with: {
            profile: {
              columns: {
                displayName: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return userFollowing.map((f: any) => ({
      id: f.following.id,
      email: f.following.email,
      displayName: f.following.profile?.displayName,
      username: f.following.profile?.username,
      avatar: f.following.profile?.avatar,
    }));
  }
}
