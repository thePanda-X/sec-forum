import "reflect-metadata";
import { Controller, Get, Post, Put, Delete } from "elysia-decorators";
import { db } from "../../db";
import { reports } from "../../db/schema";
import { eq } from "drizzle-orm";

@Controller("/reports")
export class ReportsController {
  @Post("/", {
    detail: {
      tags: ["Reports"],
      summary: "Create report",
      description: "Report content to moderators",
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                targetType: { type: "string", enum: ["post", "comment", "user"] },
                targetId: { type: "number" },
                reason: { type: "string" },
              },
              required: ["targetType", "targetId", "reason"],
            },
          },
        },
      },
      responses: {
        201: { description: "Report created" },
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

    const [report] = await db
      .insert(reports)
      .values({
        reporterId: currentUser.id,
        targetType: body.targetType,
        targetId: body.targetId,
        reason: body.reason,
      })
      .returning();

    set.status = 201;
    return { message: "Report created", id: report.id };
  }
}
