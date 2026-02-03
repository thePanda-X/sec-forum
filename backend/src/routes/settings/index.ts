import "reflect-metadata";
import { Controller, Get, Put, Post, Delete, Patch } from "elysia-decorators";
import { db } from "../../db";
import { userSettings, users, profiles } from "../../db/schema";
import { verifyPassword, hashPassword } from "../../utils/auth";
import { eq } from "drizzle-orm";
import { I18N_KEYS } from "../../i18n/keys";
import { deleteFile, extractKeyFromUrl } from "../../services/s3";

@Controller("/settings")
export class SettingsController {
  @Get("/", {
    detail: {
      tags: ["Settings"],
      summary: "Get all user settings",
      description: "Retrieve profile and settings for the authenticated user",
      responses: {
        200: { description: "User settings and profile" },
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

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, currentUser.id),
    });

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
          fontSize: "medium",
          compactMode: false,
          language: "en",
        })
        .returning();
      return {
        profile: {
          displayName: profile?.displayName,
          username: profile?.username,
          avatar: profile?.avatar,
          banner: profile?.banner,
          bannerGradientStart: profile?.bannerGradientStart,
          bannerGradientEnd: profile?.bannerGradientEnd,
          bio: profile?.bio,
          location: profile?.location,
          website: profile?.website,
          githubUsername: profile?.githubUsername,
          twitterHandle: profile?.twitterHandle,
          skills: profile?.skills,
        },
        settings: {
          theme: newSettings.theme,
          fontSize: newSettings.fontSize,
          compactMode: newSettings.compactMode,
          emailNotifications: newSettings.emailNotifications,
          pushNotifications: newSettings.pushNotifications,
          language: newSettings.language,
        },
      };
    }

    return {
      profile: {
        displayName: profile?.displayName,
        username: profile?.username,
        avatar: profile?.avatar,
        banner: profile?.banner,
        bannerGradientStart: profile?.bannerGradientStart,
        bannerGradientEnd: profile?.bannerGradientEnd,
        bio: profile?.bio,
        location: profile?.location,
        website: profile?.website,
        githubUsername: profile?.githubUsername,
        twitterHandle: profile?.twitterHandle,
        skills: profile?.skills,
      },
      settings: {
        theme: settings.theme,
        fontSize: settings.fontSize,
        compactMode: settings.compactMode,
        emailNotifications: settings.emailNotifications,
        pushNotifications: settings.pushNotifications,
        language: settings.language,
      },
    };
  }

  @Get("/profile", {
    detail: {
      tags: ["Settings"],
      summary: "Get user profile",
      description: "Retrieve the authenticated user's profile",
      responses: {
        200: { description: "User profile" },
        401: { description: "Unauthorized" },
      },
    },
  } as any)
  async getProfile({ user, set }: any) {
    const currentUser = await user;
    if (!currentUser) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, currentUser.id),
    });

    if (!profile) {
      set.status = 404;
      return { error: "Profile not found" };
    }

    return {
      displayName: profile.displayName,
      username: profile.username,
      avatar: profile.avatar,
      banner: profile.banner,
      bannerGradientStart: profile.bannerGradientStart,
      bannerGradientEnd: profile.bannerGradientEnd,
      bio: profile.bio,
      location: profile.location,
      website: profile.website,
      githubUsername: profile.githubUsername,
      twitterHandle: profile.twitterHandle,
      skills: profile.skills,
    };
  }

  @Put("/profile", {
    detail: {
      tags: ["Settings"],
      summary: "Update user profile",
      description: "Update the authenticated user's profile",
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                displayName: { type: "string" },
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
      },
    },
  } as any)
  async updateProfile({ body, user, set }: any) {
    const currentUser = await user;
    if (!currentUser) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, currentUser.id),
    });

    if (!profile) {
      set.status = 404;
      return { error: "Profile not found" };
    }

    await db
      .update(profiles)
      .set({
        ...(body.displayName !== undefined && { displayName: body.displayName }),
        ...(body.bio !== undefined && { bio: body.bio }),
        ...(body.location !== undefined && { location: body.location }),
        ...(body.website !== undefined && { website: body.website }),
        ...(body.githubUsername !== undefined && { githubUsername: body.githubUsername }),
        ...(body.twitterHandle !== undefined && { twitterHandle: body.twitterHandle }),
        ...(body.skills !== undefined && { skills: body.skills }),
      })
      .where(eq(profiles.id, profile.id));

    return { message: "Profile updated successfully" };
  }

  @Put("/avatar", {
    detail: {
      tags: ["Settings"],
      summary: "Update avatar",
      description: "Update the authenticated user's avatar",
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
      },
    },
  } as any)
  async updateAvatar({ body, user, set }: any) {
    const currentUser = await user;
    if (!currentUser) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, currentUser.id),
    });

    if (!profile) {
      set.status = 404;
      return { error: "Profile not found" };
    }

    await db
      .update(profiles)
      .set({ avatar: body.avatar })
      .where(eq(profiles.id, profile.id));

    return { message: "Avatar updated successfully" };
  }

  @Put("/banner", {
    detail: {
      tags: ["Settings"],
      summary: "Update banner",
      description: "Update the authenticated user's banner (image or gradient)",
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                banner: { type: "string", nullable: true },
                bannerGradientStart: { type: "string", nullable: true },
                bannerGradientEnd: { type: "string", nullable: true },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Banner updated" },
        401: { description: "Unauthorized" },
        400: { description: "Invalid request" },
      },
    },
  } as any)
  async updateBanner({ body, user, set }: any) {
    const currentUser = await user;
    if (!currentUser) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, currentUser.id),
    });

    if (!profile) {
      set.status = 404;
      return { error: "Profile not found" };
    }

    // Validate: Either banner image OR both gradient colors, but not both
    const hasBannerImage = body.banner !== null && body.banner !== undefined && body.banner !== "";
    const hasGradientColors = body.bannerGradientStart && body.bannerGradientEnd;

    if (hasBannerImage && hasGradientColors) {
      set.status = 400;
      return { error: "Cannot set both banner image and gradient colors" };
    }

    // Delete old banner image if setting gradient or removing banner
    if (hasGradientColors || !hasBannerImage) {
      if (profile.banner) {
        const oldKey = extractKeyFromUrl(profile.banner);
        if (oldKey) {
          try {
            await deleteFile(oldKey);
          } catch (error) {
            console.error("Failed to delete old banner:", error);
          }
        }
      }
    }

    // Update banner fields
    await db
      .update(profiles)
      .set({
        banner: body.banner || null,
        bannerGradientStart: body.bannerGradientStart || null,
        bannerGradientEnd: body.bannerGradientEnd || null,
      })
      .where(eq(profiles.id, profile.id));

    return { message: "Banner updated successfully" };
  }

  @Get("/appearance", {
    detail: {
      tags: ["Settings"],
      summary: "Get appearance settings",
      description: "Retrieve the authenticated user's appearance settings",
      responses: {
        200: { description: "Appearance settings" },
        401: { description: "Unauthorized" },
      },
    },
  } as any)
  async getAppearance({ user, set }: any) {
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
          theme: "light",
          fontSize: "medium",
          compactMode: false,
        })
        .returning();
      return {
        theme: newSettings.theme,
        fontSize: newSettings.fontSize,
        compactMode: newSettings.compactMode,
      };
    }

    return {
      theme: settings.theme,
      fontSize: settings.fontSize,
      compactMode: settings.compactMode,
    };
  }

  @Put("/appearance", {
    detail: {
      tags: ["Settings"],
      summary: "Update appearance settings",
      description: "Update the authenticated user's appearance settings",
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                theme: { type: "string", enum: ["light", "dark"] },
                fontSize: { type: "string", enum: ["small", "medium", "large"] },
                compactMode: { type: "boolean" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Appearance settings updated" },
        401: { description: "Unauthorized" },
      },
    },
  } as any)
  async updateAppearance({ body, user, set }: any) {
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
        theme: body.theme ?? "light",
        fontSize: body.fontSize ?? "medium",
        compactMode: body.compactMode ?? false,
      });
    } else {
      await db
        .update(userSettings)
        .set({
          ...(body.theme && { theme: body.theme }),
          ...(body.fontSize && { fontSize: body.fontSize }),
          ...(body.compactMode !== undefined && { compactMode: body.compactMode }),
        })
        .where(eq(userSettings.id, settings.id));
    }

    return { message: "Appearance settings updated successfully" };
  }

  @Get("/security", {
    detail: {
      tags: ["Settings"],
      summary: "Get security settings",
      description: "Retrieve the authenticated user's security settings",
      responses: {
        200: { description: "Security settings" },
        401: { description: "Unauthorized" },
      },
    },
  } as any)
  async getSecurity({ user, set }: any) {
    const currentUser = await user;
    if (!currentUser) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    return {
      twoFactorEnabled: false,
    };
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
  async deleteAccount({ body, user, set, cookie, jwt }: any) {
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
    await db.delete(userSettings).where(eq(userSettings.userId, currentUser.id));
    await db.delete(users).where(eq(users.id, currentUser.id));

    cookie.auth_token.delete();

    return { message: "Account deleted successfully" };
  }

  @Get("/language", {
    detail: {
      tags: ["Settings"],
      summary: "Get language preference",
      description: "Retrieve the authenticated user's language preference",
      responses: {
        200: { description: "Language preference" },
        401: { description: "Unauthorized" },
      },
    },
  } as any)
  async getLanguage({ user, set }: any) {
    const currentUser = await user;
    if (!currentUser) {
      set.status = 401;
      return { error: I18N_KEYS.ERROR.UNAUTHORIZED };
    }

    const settings = await db.query.userSettings.findFirst({
      where: eq(userSettings.userId, currentUser.id),
    });

    if (!settings) {
      return { language: "en" };
    }

    return { language: settings.language };
  }

  @Patch("/language", {
    detail: {
      tags: ["Settings"],
      summary: "Update language preference",
      description: "Update the authenticated user's language preference",
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                language: { type: "string", enum: ["en", "es"] },
              },
              required: ["language"],
            },
          },
        },
      },
      responses: {
        200: { description: "Language preference updated" },
        401: { description: "Unauthorized" },
      },
    },
  } as any)
  async updateLanguage({ body, user, set }: any) {
    const currentUser = await user;
    if (!currentUser) {
      set.status = 401;
      return { error: I18N_KEYS.ERROR.UNAUTHORIZED };
    }

    const validLanguages = ["en", "es"];
    if (!validLanguages.includes(body.language)) {
      set.status = 400;
      return { error: "Invalid language. Supported languages: en, es" };
    }

    const settings = await db.query.userSettings.findFirst({
      where: eq(userSettings.userId, currentUser.id),
    });

    if (!settings) {
      await db.insert(userSettings).values({
        userId: currentUser.id,
        language: body.language,
      });
    } else {
      await db
        .update(userSettings)
        .set({ language: body.language })
        .where(eq(userSettings.id, settings.id));
    }

    return { 
      message: I18N_KEYS.SUCCESS.LANGUAGE_UPDATED,
      language: body.language 
    };
  }
}
