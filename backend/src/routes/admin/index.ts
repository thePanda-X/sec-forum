import "reflect-metadata";
import { Controller, Get, Post, Put, Delete } from "elysia-decorators";
import { db } from "../../db";
import { categories, users, posts, reports, auditLogs } from "../../db/schema";
import { hasRole } from "../../utils/auth";
import type { UserRoleType } from "../../db/schema";
import { eq, desc, count } from "drizzle-orm";

@Controller("/admin")
export class AdminController {
  @Get("/dashboard", {
    detail: {
      tags: ["Admin"],
      summary: "Admin dashboard",
      description: "Get dashboard statistics (admin only)",
      responses: {
        200: { description: "Dashboard stats" },
        403: { description: "Admin access required" },
      },
    },
  } as any)
  async dashboard({ user, set }: any) {
    const currentUser = await user;
    if (!currentUser || !hasRole(currentUser.role as UserRoleType, "ADMIN")) {
      set.status = 403;
      return { error: "Admin access required" };
    }

    const [usersCount] = await db.select({ count: count() }).from(users);
    const [postsCount] = await db.select({ count: count() }).from(posts);
    const [reportsCount] = await db
      .select({ count: count() })
      .from(reports)
      .where(eq(reports.status, "PENDING"));

    const recentLogs = await db.query.auditLogs.findMany({
      orderBy: [desc(auditLogs.createdAt)],
      limit: 10,
      with: {
        user: {
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
      },
    });

    return {
      usersCount: usersCount?.count || 0,
      postsCount: postsCount?.count || 0,
      pendingReports: reportsCount?.count || 0,
      recentActivity: recentLogs.map((log: any) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        details: log.details,
        createdAt: log.createdAt,
        adminUsername: log.user.profile?.displayName || log.user.email,
        targetName: log.entityType?.toLowerCase(),
        targetId: log.entityId,
      })),
    };
  }

  @Get("/stats", {
    detail: {
      tags: ["Admin"],
      summary: "Admin stats",
      description: "Get admin stats (admin only)",
      responses: {
        200: { description: "Stats" },
        403: { description: "Admin access required" },
      },
    },
  } as any)
  async stats({ user, set }: any) {
    const currentUser = await user;
    if (!currentUser || !hasRole(currentUser.role as UserRoleType, "ADMIN")) {
      set.status = 403;
      return { error: "Admin access required" };
    }

    const [usersCount] = await db.select({ count: count() }).from(users);
    const [postsCount] = await db.select({ count: count() }).from(posts);
    const [categoriesCount] = await db.select({ count: count() }).from(categories);
    const [reportsCount] = await db
      .select({ count: count() })
      .from(reports)
      .where(eq(reports.status, "PENDING"));

    const recentLogs = await db.query.auditLogs.findMany({
      orderBy: [desc(auditLogs.createdAt)],
      limit: 10,
      with: {
        user: {
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
      },
    });

    return {
      stats: {
        usersCount: usersCount?.count || 0,
        postsCount: postsCount?.count || 0,
        categoriesCount: categoriesCount?.count || 0,
        pendingReports: reportsCount?.count || 0,
      },
      recentActivity: recentLogs.map((log: any) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        details: log.details,
        createdAt: log.createdAt,
        adminUsername: log.user.profile?.displayName || log.user.email,
        targetName: log.entityType?.toLowerCase(),
        targetId: log.entityId,
      })),
    };
  }

  @Get("/users", {
    detail: {
      tags: ["Admin"],
      summary: "List all users",
      description: "Get list of all users (admin only)",
      responses: {
        200: { description: "List of users" },
        403: { description: "Admin access required" },
      },
    },
  } as any)
  async users({ user, set }: any) {
    const currentUser = await user;
    if (!currentUser || !hasRole(currentUser.role as UserRoleType, "ADMIN")) {
      set.status = 403;
      return { error: "Admin access required" };
    }

    const allUsers = await db.query.users.findMany({
      orderBy: [desc(users.createdAt)],
      with: {
        profile: {
          columns: {
            displayName: true,
            username: true,
          },
        },
      },
    });

    return allUsers.map((u: any) => ({
      id: String(u.id),
      email: u.email,
      role: u.role?.toLowerCase() as 'user' | 'moderator' | 'admin',
      name: u.profile?.displayName,
      username: u.profile?.username,
      reputation: 0,
      avatar: u.profile?.avatar,
      isBanned: u.isBanned || false,
      createdAt: u.createdAt,
    }));
  }

  @Put("/users/:id/role", {
    detail: {
      tags: ["Admin"],
      summary: "Update user role",
      description: "Change a user's role (admin only)",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "number" },
          description: "User ID",
        },
      ],
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                role: { type: "string", enum: ["ADMIN", "MODERATOR", "USER"] },
              },
              required: ["role"],
            },
          },
        },
      },
      responses: {
        200: { description: "Role updated" },
        403: { description: "Admin access required" },
        404: { description: "User not found" },
      },
    },
  } as any)
  async updateUserRole({ params, body, user, set }: any) {
    const currentUser = await user;
    if (!currentUser || !hasRole(currentUser.role as UserRoleType, "ADMIN")) {
      set.status = 403;
      return { error: "Admin access required" };
    }

    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, Number(params.id)),
    });

    if (!targetUser) {
      set.status = 404;
      return { error: "User not found" };
    }

    await db
      .update(users)
      .set({ role: body.role })
      .where(eq(users.id, Number(params.id)));

    return { message: "User role updated" };
  }

  @Post("/users/:id/promote", {
    detail: {
      tags: ["Admin"],
      summary: "Promote user",
      description: "Promote a user to moderator (admin only)",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "number" },
          description: "User ID",
        },
      ],
      responses: {
        200: { description: "User promoted" },
        403: { description: "Admin access required" },
        404: { description: "User not found" },
      },
    },
  } as any)
  async promoteUser({ params, user, set }: any) {
    const currentUser = await user;
    if (!currentUser || !hasRole(currentUser.role as UserRoleType, "ADMIN")) {
      set.status = 403;
      return { error: "Admin access required" };
    }

    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, Number(params.id)),
    });

    if (!targetUser) {
      set.status = 404;
      return { error: "User not found" };
    }

    if (targetUser.role === "MODERATOR" || targetUser.role === "ADMIN") {
      set.status = 400;
      return { error: "User is already a moderator or admin" };
    }

    await db
      .update(users)
      .set({ role: "MODERATOR" })
      .where(eq(users.id, Number(params.id)));

    await db.insert(auditLogs).values({
      userId: currentUser.id,
      action: "PROMOTE_USER",
      entityType: "USER",
      entityId: Number(params.id),
      details: `User ${targetUser.email} was promoted to moderator`,
    });

    return { message: "User promoted to moderator" };
  }

  @Post("/users/:id/demote", {
    detail: {
      tags: ["Admin"],
      summary: "Demote user",
      description: "Demote a moderator to user (admin only)",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "number" },
          description: "User ID",
        },
      ],
      responses: {
        200: { description: "User demoted" },
        403: { description: "Admin access required" },
        404: { description: "User not found" },
      },
    },
  } as any)
  async demoteUser({ params, user, set }: any) {
    const currentUser = await user;
    if (!currentUser || !hasRole(currentUser.role as UserRoleType, "ADMIN")) {
      set.status = 403;
      return { error: "Admin access required" };
    }

    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, Number(params.id)),
    });

    if (!targetUser) {
      set.status = 404;
      return { error: "User not found" };
    }

    if (targetUser.role === "ADMIN") {
      set.status = 400;
      return { error: "Cannot demote admin users" };
    }

    if (targetUser.role === "USER") {
      set.status = 400;
      return { error: "User is already a regular user" };
    }

    await db
      .update(users)
      .set({ role: "USER" })
      .where(eq(users.id, Number(params.id)));

    await db.insert(auditLogs).values({
      userId: currentUser.id,
      action: "DEMOTE_USER",
      entityType: "USER",
      entityId: Number(params.id),
      details: `User ${targetUser.email} was demoted to user`,
    });

    return { message: "User demoted to user" };
  }

  @Post("/users/:id/ban", {
    detail: {
      tags: ["Admin"],
      summary: "Ban user",
      description: "Ban a user (admin only)",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "number" },
          description: "User ID",
        },
      ],
      responses: {
        200: { description: "User banned" },
        403: { description: "Admin access required" },
        404: { description: "User not found" },
      },
    },
  } as any)
  async banUser({ params, user, set }: any) {
    const currentUser = await user;
    if (!currentUser || !hasRole(currentUser.role as UserRoleType, "ADMIN")) {
      set.status = 403;
      return { error: "Admin access required" };
    }

    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, Number(params.id)),
    });

    if (!targetUser) {
      set.status = 404;
      return { error: "User not found" };
    }

    await db
      .update(users)
      .set({ 
        role: "USER" as any,
        isBanned: true
      })
      .where(eq(users.id, Number(params.id)));

    await db.insert(auditLogs).values({
      userId: currentUser.id,
      action: "BAN_USER",
      entityType: "USER",
      entityId: Number(params.id),
      details: `User ${targetUser.email} was banned`,
    });

    return { message: "User banned" };
  }

  @Post("/users/:id/unban", {
    detail: {
      tags: ["Admin"],
      summary: "Unban user",
      description: "Unban a user (admin only)",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "number" },
          description: "User ID",
        },
      ],
      responses: {
        200: { description: "User unbanned" },
        403: { description: "Admin access required" },
        404: { description: "User not found" },
      },
    },
  } as any)
  async unbanUser({ params, user, set }: any) {
    const currentUser = await user;
    if (!currentUser || !hasRole(currentUser.role as UserRoleType, "ADMIN")) {
      set.status = 403;
      return { error: "Admin access required" };
    }

    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, Number(params.id)),
    });

    if (!targetUser) {
      set.status = 404;
      return { error: "User not found" };
    }

    await db
      .update(users)
      .set({ isBanned: false })
      .where(eq(users.id, Number(params.id)));

    await db.insert(auditLogs).values({
      userId: currentUser.id,
      action: "UNBAN_USER",
      entityType: "USER",
      entityId: Number(params.id),
      details: `User ${targetUser.email} was unbanned`,
    });

    return { message: "User unbanned" };
  }

  @Get("/reports", {
    detail: {
      tags: ["Admin"],
      summary: "List reports",
      description: "Get all content reports (admin only)",
      parameters: [
        {
          name: "status",
          in: "query",
          required: false,
          schema: { type: "string", enum: ["PENDING", "REVIEWED", "RESOLVED", "DISMISSED"] },
          description: "Filter by status",
        },
      ],
      responses: {
        200: { description: "List of reports" },
        403: { description: "Admin access required" },
      },
    },
  } as any)
  async reports({ user, set, query }: any) {
    const currentUser = await user;
    if (!currentUser || !hasRole(currentUser.role as UserRoleType, "ADMIN")) {
      set.status = 403;
      return { error: "Admin access required" };
    }

    const allReports = await db.query.reports.findMany({
      ...(query.status && { where: eq(reports.status, query.status) }),
      orderBy: [desc(reports.createdAt)],
      with: {
        reporter: {
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
      },
    });

    return allReports.map((r: any) => ({
      id: r.id,
      targetType: r.targetType,
      targetId: r.targetId,
      reason: r.reason,
      status: r.status,
      createdAt: r.createdAt,
      reporter: {
        id: r.reporter.id,
        email: r.reporter.email,
        displayName: r.reporter.profile?.displayName,
      },
    }));
  }

  @Put("/reports/:id/status", {
    detail: {
      tags: ["Admin"],
      summary: "Update report status",
      description: "Change the status of a report (admin only)",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "number" },
          description: "Report ID",
        },
      ],
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: {
                  type: "string",
                  enum: ["PENDING", "REVIEWED", "RESOLVED", "DISMISSED"],
                },
              },
              required: ["status"],
            },
          },
        },
      },
      responses: {
        200: { description: "Report status updated" },
        403: { description: "Admin access required" },
        404: { description: "Report not found" },
      },
    },
  } as any)
  async updateReportStatus({ params, body, user, set }: any) {
    const currentUser = await user;
    if (!currentUser || !hasRole(currentUser.role as UserRoleType, "ADMIN")) {
      set.status = 403;
      return { error: "Admin access required" };
    }

    const report = await db.query.reports.findFirst({
      where: eq(reports.id, Number(params.id)),
    });

    if (!report) {
      set.status = 404;
      return { error: "Report not found" };
    }

    await db
      .update(reports)
      .set({
        status: body.status,
        updatedAt: new Date(),
      })
      .where(eq(reports.id, Number(params.id)));

    return { message: "Report status updated" };
  }

  @Get("/audit-logs", {
    detail: {
      tags: ["Admin"],
      summary: "Get audit logs",
      description: "Retrieve system audit logs (admin only)",
      responses: {
        200: { description: "Audit logs" },
        403: { description: "Admin access required" },
      },
    },
  } as any)
  async auditLogs({ user, set }: any) {
    const currentUser = await user;
    if (!currentUser || !hasRole(currentUser.role as UserRoleType, "ADMIN")) {
      set.status = 403;
      return { error: "Admin access required" };
    }

    const logs = await db.query.auditLogs.findMany({
      orderBy: [desc(auditLogs.createdAt)],
      with: {
        user: {
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
      },
    });

    return logs.map((log: any) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      details: log.details,
      createdAt: log.createdAt,
      user: {
        id: log.user.id,
        email: log.user.email,
        displayName: log.user.profile?.displayName,
      },
    }));
  }

  @Get("/audit-log", {
    detail: {
      tags: ["Admin"],
      summary: "Get audit log",
      description: "Retrieve system audit log (admin only)",
      parameters: [
        {
          name: "userId",
          in: "query",
          required: false,
          schema: { type: "number" },
          description: "Filter logs by user ID",
        },
      ],
      responses: {
        200: { description: "Audit log" },
        403: { description: "Admin access required" },
      },
    },
  } as any)
  async auditLog({ user, set, query }: any) {
    const currentUser = await user;
    if (!currentUser || !hasRole(currentUser.role as UserRoleType, "ADMIN")) {
      set.status = 403;
      return { error: "Admin access required" };
    }

    const logs = await db.query.auditLogs.findMany({
      ...(query.userId && { where: eq(auditLogs.userId, Number(query.userId)) }),
      orderBy: [desc(auditLogs.createdAt)],
      with: {
        user: {
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
      },
    });

    return {
      logs: logs.map((log: any) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        details: log.details,
        createdAt: log.createdAt,
        adminUsername: log.user.profile?.displayName || log.user.email,
        targetName: log.entityType?.toLowerCase(),
        targetId: log.entityId,
      })),
    };
  }

  @Get("/posts", {
    detail: {
      tags: ["Admin"],
      summary: "List all posts",
      description: "Get list of all posts (admin only)",
      responses: {
        200: { description: "List of posts" },
        403: { description: "Admin access required" },
      },
    },
  } as any)
  async adminPosts({ user, set }: any) {
    const currentUser = await user;
    if (!currentUser || !hasRole(currentUser.role as UserRoleType, "ADMIN")) {
      set.status = 403;
      return { error: "Admin access required" };
    }

    const allPosts = await db.query.posts.findMany({
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
      },
    });

    return {
      posts: allPosts.map((p: any) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        body: p.body,
        pinned: p.pinned,
        locked: p.locked,
        views: p.views,
        createdAt: p.createdAt,
        author: {
          id: p.author.id,
          email: p.author.email,
          displayName: p.author.profile?.displayName,
          username: p.author.profile?.username,
          avatar: p.author.profile?.avatar,
        },
      })),
    };
  }

  @Post("/posts/:id/pin", {
    detail: {
      tags: ["Admin"],
      summary: "Pin a post",
      description: "Pin a post (admin only)",
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
        200: { description: "Post pinned" },
        403: { description: "Admin access required" },
        404: { description: "Post not found" },
      },
    },
  } as any)
  async pinPost({ params, user, set }: any) {
    const currentUser = await user;
    if (!currentUser || !hasRole(currentUser.role as UserRoleType, "ADMIN")) {
      set.status = 403;
      return { error: "Admin access required" };
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
      .set({ pinned: true })
      .where(eq(posts.id, Number(params.id)));

    return { message: "Post pinned" };
  }

  @Post("/posts/:id/unpin", {
    detail: {
      tags: ["Admin"],
      summary: "Unpin a post",
      description: "Unpin a post (admin only)",
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
        200: { description: "Post unpinned" },
        403: { description: "Admin access required" },
        404: { description: "Post not found" },
      },
    },
  } as any)
  async unpinPost({ params, user, set }: any) {
    const currentUser = await user;
    if (!currentUser || !hasRole(currentUser.role as UserRoleType, "ADMIN")) {
      set.status = 403;
      return { error: "Admin access required" };
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
      .set({ pinned: false })
      .where(eq(posts.id, Number(params.id)));

    return { message: "Post unpinned" };
  }

  @Post("/posts/:id/lock", {
    detail: {
      tags: ["Admin"],
      summary: "Lock a post",
      description: "Lock a post to prevent new comments (admin only)",
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
        200: { description: "Post locked" },
        403: { description: "Admin access required" },
        404: { description: "Post not found" },
      },
    },
  } as any)
  async lockPost({ params, user, set }: any) {
    const currentUser = await user;
    if (!currentUser || !hasRole(currentUser.role as UserRoleType, "ADMIN")) {
      set.status = 403;
      return { error: "Admin access required" };
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
      .set({ locked: true })
      .where(eq(posts.id, Number(params.id)));

    return { message: "Post locked" };
  }

  @Post("/posts/:id/unlock", {
    detail: {
      tags: ["Admin"],
      summary: "Unlock a post",
      description: "Unlock a post to allow new comments (admin only)",
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
        200: { description: "Post unlocked" },
        403: { description: "Admin access required" },
        404: { description: "Post not found" },
      },
    },
  } as any)
  async unlockPost({ params, user, set }: any) {
    const currentUser = await user;
    if (!currentUser || !hasRole(currentUser.role as UserRoleType, "ADMIN")) {
      set.status = 403;
      return { error: "Admin access required" };
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
      .set({ locked: false })
      .where(eq(posts.id, Number(params.id)));

    return { message: "Post unlocked" };
  }

  @Post("/posts/:id/delete", {
    detail: {
      tags: ["Admin"],
      summary: "Delete a post",
      description: "Delete a post (admin only)",
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
        403: { description: "Admin access required" },
        404: { description: "Post not found" },
      },
    },
  } as any)
  async deletePost({ params, user, set }: any) {
    const currentUser = await user;
    if (!currentUser || !hasRole(currentUser.role as UserRoleType, "ADMIN")) {
      set.status = 403;
      return { error: "Admin access required" };
    }

    const post = await db.query.posts.findFirst({
      where: eq(posts.id, Number(params.id)),
    });

    if (!post) {
      set.status = 404;
      return { error: "Post not found" };
    }

    await db.delete(posts).where(eq(posts.id, Number(params.id)));

    return { message: "Post deleted" };
  }

  @Post("/categories", {
    detail: {
      tags: ["Admin", "Categories"],
      summary: "Create category",
      description: "Create a new category (admin only)",
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                slug: { type: "string" },
                description: { type: "string" },
                color: { type: "string" },
                icon: { type: "string" },
              },
              required: ["name", "slug"],
            },
          },
        },
      },
      responses: {
        201: { description: "Category created" },
        403: { description: "Admin access required" },
      },
    },
  } as any)
  async createCategory({ body, user, set }: any) {
    const currentUser = await user;
    if (!currentUser || !hasRole(currentUser.role as UserRoleType, "ADMIN")) {
      set.status = 403;
      return { error: "Admin access required" };
    }

    const [category] = await db
      .insert(categories)
      .values({
        name: body.name,
        slug: body.slug,
        description: body.description,
        color: body.color || "#10b981",
        icon: body.icon || "FolderTree",
      })
      .returning();

    set.status = 201;
    return { message: "Category created", category };
  }

  @Put("/categories/:id", {
    detail: {
      tags: ["Admin", "Categories"],
      summary: "Update category",
      description: "Update an existing category (admin only)",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "number" },
          description: "Category ID",
        },
      ],
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                slug: { type: "string" },
                description: { type: "string" },
                color: { type: "string" },
                icon: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Category updated" },
        403: { description: "Admin access required" },
        404: { description: "Category not found" },
      },
    },
  } as any)
  async updateCategory({ params, body, user, set }: any) {
    const currentUser = await user;
    if (!currentUser || !hasRole(currentUser.role as UserRoleType, "ADMIN")) {
      set.status = 403;
      return { error: "Admin access required" };
    }

    const category = await db.query.categories.findFirst({
      where: eq(categories.id, Number(params.id)),
    });

    if (!category) {
      set.status = 404;
      return { error: "Category not found" };
    }

    await db
      .update(categories)
      .set({
        ...(body.name && { name: body.name }),
        ...(body.slug && { slug: body.slug }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.color && { color: body.color }),
        ...(body.icon && { icon: body.icon }),
        updatedAt: new Date(),
      })
      .where(eq(categories.id, Number(params.id)));

    return { message: "Category updated" };
  }

  @Delete("/categories/:id", {
    detail: {
      tags: ["Admin", "Categories"],
      summary: "Delete category",
      description: "Delete a category (admin only)",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "number" },
          description: "Category ID",
        },
      ],
      responses: {
        200: { description: "Category deleted" },
        403: { description: "Admin access required" },
        404: { description: "Category not found" },
      },
    },
  } as any)
  async deleteCategory({ params, user, set }: any) {
    const currentUser = await user;
    if (!currentUser || !hasRole(currentUser.role as UserRoleType, "ADMIN")) {
      set.status = 403;
      return { error: "Admin access required" };
    }

    const category = await db.query.categories.findFirst({
      where: eq(categories.id, Number(params.id)),
    });

    if (!category) {
      set.status = 404;
      return { error: "Category not found" };
    }

    await db.delete(categories).where(eq(categories.id, Number(params.id)));

    return { message: "Category deleted" };
  }
}
