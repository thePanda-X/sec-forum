import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-me";

type User = {
  id: number;
  email: string;
  role: "ADMIN" | "MODERATOR" | "USER";
};

function isValidRole(role: unknown): role is "ADMIN" | "MODERATOR" | "USER" {
  return role === "ADMIN" || role === "MODERATOR" || role === "USER";
}

export const authPlugin = (app: Elysia) =>
  app
    .use(
      jwt({
        name: "jwt",
        secret: JWT_SECRET,
        exp: "7d",
      })
    )
    .derive(async ({ jwt, cookie: { auth_token } }) => {
      const token = auth_token.value;
      let user: User | null = null;

      if (token && typeof token === "string") {
        try {
          const payload = await jwt.verify(token);
          if (payload && typeof payload !== "boolean") {
            const dbUser = await db.query.users.findFirst({
              where: eq(users.id, Number(payload.sub)),
            });

            if (dbUser && !dbUser.isBanned) {
              await db.update(users).set({ lastSeen: new Date() }).where(eq(users.id, dbUser.id));
              const role = isValidRole(dbUser.role) ? dbUser.role : "USER";
              user = {
                id: dbUser.id,
                email: dbUser.email,
                role,
              };
            }
          }
        } catch {
          user = null;
        }
      }

      return { user };
    });

export const authenticated = t.Object({
  user: t.Nullable(
    t.Object({
      id: t.Number(),
      email: t.String(),
      role: t.String(),
    })
  ),
});
