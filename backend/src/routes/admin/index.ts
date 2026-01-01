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

    return {
      usersCount: usersCount?.count || 0,
      postsCount: postsCount?.count || 0,
      pendingReports: reportsCount?.count || 0,
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
      id: u.id,
      email: u.email,
      role: u.role,
      displayName: u.profile?.displayName,
      username: u.profile?.username,
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
      .set({ role: "USER" as any })
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
