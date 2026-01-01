import "reflect-metadata";
import { Controller, Get, Put, Post, Delete } from "elysia-decorators";
import { db } from "../../db";
import { userSettings, users, profiles } from "../../db/schema";
import { verifyPassword, hashPassword } from "../../utils/auth";
import { eq } from "drizzle-orm";

@Controller("/settings")
export class SettingsController {
  @Get("/", {
    detail: {
      tags: ["Settings"],
      summary: "Get user settings",
      description: "Retrieve settings for the authenticated user",
      responses: {
        200: { description: "User settings" },
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

    const settings = await db.query.userSettings.findFirst({
      where: eq(userSettings.userId, currentUser.id),
    });

    if (!settings) {
      const [newSettings] = await db
        .insert(userSettings)
        .values({
          userId: currentUser.id,
          emailNotifications: true,
          pushNotifications: true,
          theme: "light",
        })
        .returning();
      return newSettings;
    }

    return settings;
  }

  @Put("/", {
    detail: {
      tags: ["Settings"],
      summary: "Update user settings",
      description: "Update settings for the authenticated user",
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                emailNotifications: { type: "boolean" },
                pushNotifications: { type: "boolean" },
                theme: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Settings updated" },
        401: { description: "Unauthorized" },
      },
    },
  } as any)
  async update({ body, user, set }: any) {
    const currentUser = await user;
    if (!currentUser) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const settings = await db.query.userSettings.findFirst({
      where: eq(userSettings.userId, currentUser.id),
    });

    if (!settings) {
      await db.insert(userSettings).values({
        userId: currentUser.id,
        emailNotifications: body.emailNotifications ?? true,
        pushNotifications: body.pushNotifications ?? true,
        theme: body.theme ?? "light",
      });
    } else {
      await db
        .update(userSettings)
        .set({
          ...(body.emailNotifications !== undefined && { emailNotifications: body.emailNotifications }),
          ...(body.pushNotifications !== undefined && { pushNotifications: body.pushNotifications }),
          ...(body.theme && { theme: body.theme }),
        })
        .where(eq(userSettings.id, settings.id));
    }

    return { message: "Settings updated" };
  }

  @Post("/password", {
    detail: {
      tags: ["Settings"],
      summary: "Change password",
      description: "Change the user's password",
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                currentPassword: { type: "string", format: "password" },
                newPassword: { type: "string", format: "password" },
              },
              required: ["currentPassword", "newPassword"],
            },
          },
        },
      },
      responses: {
        200: { description: "Password changed" },
        400: { description: "Invalid current password" },
        401: { description: "Unauthorized" },
      },
    },
  } as any)
  async changePassword({ body, user, set }: any) {
    const currentUser = await user;
    if (!currentUser) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, currentUser.id),
    });

    if (!userRecord) {
      set.status = 404;
      return { error: "User not found" };
    }

    const isValid = await verifyPassword(body.currentPassword, userRecord.password);
    if (!isValid) {
      set.status = 400;
      return { error: "Current password is incorrect" };
    }

    const hashedPassword = await hashPassword(body.newPassword);

    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, currentUser.id));

    return { message: "Password changed successfully" };
  }

  @Delete("/account", {
    detail: {
      tags: ["Settings"],
      summary: "Delete account",
      description: "Permanently delete user account",
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                password: { type: "string", format: "password" },
              },
              required: ["password"],
            },
          },
        },
      },
      responses: {
        200: { description: "Account deleted" },
        400: { description: "Invalid password" },
        401: { description: "Unauthorized" },
      },
    },
  } as any)
  async deleteAccount({ body, user, set }: any) {
    const currentUser = await user;
    if (!currentUser) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, currentUser.id),
    });

    if (!userRecord) {
      set.status = 404;
      return { error: "User not found" };
    }

    const isValid = await verifyPassword(body.password, userRecord.password);
    if (!isValid) {
      set.status = 400;
      return { error: "Password is incorrect" };
    }

    await db.delete(profiles).where(eq(profiles.userId, currentUser.id));
    await db.delete(users).where(eq(users.id, currentUser.id));

    return { message: "Account deleted successfully" };
  }
}
