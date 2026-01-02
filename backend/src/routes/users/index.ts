import "reflect-metadata";
import { Controller, Post, Get } from "elysia-decorators";
import { db } from "../../db";
import { users, profiles } from "../../db/schema";
import { hashPassword, verifyPassword } from "../../utils/auth";
import { eq } from "drizzle-orm";

@Controller("/users")
export class UsersController {
  @Post("/register", {
    detail: {
      tags: ["Auth"],
      summary: "Register a new user",
      description: "Create a new user account",
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                email: { type: "string", format: "email" },
                password: { type: "string", format: "password" },
                displayName: { type: "string" },
                username: { type: "string" },
              },
              required: ["email", "password", "displayName"],
            },
          },
        },
      },
      responses: {
        201: { description: "User created successfully" },
        409: { description: "Email already registered" },
      },
    },
  } as any)
  async register({ body, set }: any) {
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
      username: body.username || body.email.split("@")[0],
    });

    set.status = 201;
    return { message: "User created successfully", userId: user.id };
  }

  @Post("/login", {
    detail: {
      tags: ["Auth"],
      summary: "Login user",
      description: "Authenticate and login a user",
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                email: { type: "string", format: "email" },
                password: { type: "string", format: "password" },
              },
              required: ["email", "password"],
            },
          },
        },
      },
      responses: {
        200: { description: "Login successful" },
        401: { description: "Invalid credentials" },
      },
    },
  } as any)
  async login({ body, cookie, set, jwt }: any) {
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
  }

  @Get("/me", {
    detail: {
      tags: ["Auth"],
      summary: "Get current user",
      description: "Retrieve information about the currently authenticated user",
      responses: {
        200: { description: "User information" },
        401: { description: "Not authenticated" },
      },
    },
  } as any)
  async getMe({ user, set }: any) {
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
      role: currentUser.role.toLowerCase(),
      name: profile?.displayName,
      avatar: profile?.avatar,
      bio: profile?.bio,
    };
  }
}
