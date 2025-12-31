import { Elysia, t } from "elysia";
import { db } from "../../db";
import { users, profiles } from "../../db/schema";
import { hashPassword, verifyPassword } from "../../utils/auth";
import { authPlugin } from "../../middleware/auth";
import { eq } from "drizzle-orm";

const RegisterSchema = t.Object({
  email: t.String({ format: "email" }),
  password: t.String({ minLength: 6 }),
  displayName: t.String({ minLength: 1, maxLength: 50 }),
});

const LoginSchema = t.Object({
  email: t.String({ format: "email" }),
  password: t.String(),
});

export const usersRoutes = (app: Elysia) =>
  app
    .use(authPlugin)
    .group("/users", (app) =>
      app
        .post(
          "/register",
          async ({ body, set }) => {
            const existingUser = await db.query.users.findFirst({
              where: eq(users.email, body.email),
            });

            if (existingUser) {
              set.status = 409;
              return { error: "Email already registered" };
            }

            const hashedPassword = await hashPassword(body.password);

            const [user] = await db
              .insert(users)
              .values({
                email: body.email,
                password: hashedPassword,
              })
              .returning({ id: users.id, email: users.email });

            await db.insert(profiles).values({
              userId: user.id,
              displayName: body.displayName,
            });

            set.status = 201;
            return { message: "User created successfully", userId: user.id };
          },
          { body: RegisterSchema }
        )
        .post(
          "/login",
          async ({ body, cookie, set, jwt }) => {
            const user = await db.query.users.findFirst({
              where: eq(users.email, body.email),
            });

            if (!user) {
              set.status = 401;
              return { error: "Invalid credentials" };
            }

            const isValid = await verifyPassword(body.password, user.password);
            if (!isValid) {
              set.status = 401;
              return { error: "Invalid credentials" };
            }

            const token = await jwt.sign({
              sub: String(user.id),
              email: user.email,
              role: user.role,
            });

            cookie.auth_token.set({
              value: token,
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              maxAge: 60 * 60 * 24 * 7,
              path: "/",
            });

            return { message: "Login successful" };
          },
          { body: LoginSchema }
        )
        .get(
          "/me",
          async ({ user, set }) => {
            const currentUser = await user;
            if (!currentUser) {
              set.status = 401;
              return { error: "Not authenticated" };
            }

            const profile = await db.query.profiles.findFirst({
              where: eq(profiles.userId, currentUser.id),
            });

            return {
              id: currentUser.id,
              email: currentUser.email,
              role: currentUser.role,
              displayName: profile?.displayName,
              bio: profile?.bio,
            };
          }
        )
    );
