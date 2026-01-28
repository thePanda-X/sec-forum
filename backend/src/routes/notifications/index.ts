import "reflect-metadata";
import { Controller, Get, Post, Delete } from "elysia-decorators";
import { db } from "../../db";
import { notifications } from "../../db/schema";
import { eq, desc } from "drizzle-orm";

@Controller("/notifications")
export class NotificationsController {
  @Get("/", {
    detail: {
      tags: ["Notifications"],
      summary: "Get notifications",
      description: "Retrieve all notifications for the authenticated user",
      responses: {
        200: { description: "List of notifications" },
        401: { description: "Unauthorized" },
      },
    },
  } as any)
  async index({ user, set }: any) {
    const currentUser = await user;
    if (!currentUser) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const userNotifications = await db.query.notifications.findMany({
      where: eq(notifications.userId, currentUser.id),
      orderBy: [desc(notifications.createdAt)],
      with: {
        actor: {
          with: {
            profile: true,
          },
        },
        post: true,
      },
    });

    return userNotifications;
  }

  @Get("/unread-count", {
    detail: {
      tags: ["Notifications"],
      summary: "Get unread count",
      description: "Get the count of unread notifications",
      responses: {
        200: { description: "Unread count" },
        401: { description: "Unauthorized" },
      },
    },
  } as any)
  async unreadCount({ user, set }: any) {
    const currentUser = await user;
    if (!currentUser) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const allNotifications = await db.query.notifications.findMany({
      where: eq(notifications.userId, currentUser.id),
    });

    const unreadCount = allNotifications.filter((n) => !n.read).length;

    return { count: unreadCount };
  }

  @Post("/:id/read", {
    detail: {
      tags: ["Notifications"],
      summary: "Mark as read",
      description: "Mark a specific notification as read",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "number" },
          description: "Notification ID",
        },
      ],
      responses: {
        200: { description: "Notification marked as read" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
        404: { description: "Notification not found" },
      },
    },
  } as any)
  async markRead({ params, user, set }: any) {
    const currentUser = await user;
    if (!currentUser) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const notification = await db.query.notifications.findFirst({
      where: eq(notifications.id, Number(params.id)),
    });

    if (!notification) {
      set.status = 404;
      return { error: "Notification not found" };
    }

    if (notification.userId !== currentUser.id) {
      set.status = 403;
      return { error: "Forbidden" };
    }

    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, Number(params.id)));

    return { message: "Notification marked as read" };
  }

  @Post("/read-all", {
    detail: {
      tags: ["Notifications"],
      summary: "Mark all as read",
      description: "Mark all notifications as read",
      responses: {
        200: { description: "All notifications marked as read" },
        401: { description: "Unauthorized" },
      },
    },
  } as any)
  async readAll({ user, set }: any) {
    const currentUser = await user;
    if (!currentUser) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, currentUser.id));

    return { message: "All notifications marked as read" };
  }

  @Delete("/:id", {
    detail: {
      tags: ["Notifications"],
      summary: "Delete notification",
      description: "Delete a specific notification",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "number" },
          description: "Notification ID",
        },
      ],
      responses: {
        200: { description: "Notification deleted" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
        404: { description: "Notification not found" },
      },
    },
  } as any)
  async destroy({ params, user, set }: any) {
    const currentUser = await user;
    if (!currentUser) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const notification = await db.query.notifications.findFirst({
      where: eq(notifications.id, Number(params.id)),
    });

    if (!notification) {
      set.status = 404;
      return { error: "Notification not found" };
    }

    if (notification.userId !== currentUser.id) {
      set.status = 403;
      return { error: "Forbidden" };
    }

    await db.delete(notifications).where(eq(notifications.id, Number(params.id)));

    return { message: "Notification deleted" };
  }

  @Delete("/clear", {
    detail: {
      tags: ["Notifications"],
      summary: "Clear all notifications",
      description: "Delete all notifications for the authenticated user",
      responses: {
        200: { description: "All notifications cleared" },
        401: { description: "Unauthorized" },
      },
    },
  } as any)
  async clear({ user, set }: any) {
    const currentUser = await user;
    if (!currentUser) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    await db.delete(notifications).where(eq(notifications.userId, currentUser.id));

    return { message: "All notifications cleared" };
  }
}
