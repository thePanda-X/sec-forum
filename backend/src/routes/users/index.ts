import "reflect-metadata";
import { Controller, Post, Get } from "elysia-decorators";
import { db } from "../../db";
import { users, profiles } from "../../db/schema";
import { hashPassword, verifyPassword } from "../../utils/auth";
import { eq } from "drizzle-orm";

@Controller("/users")
export class UsersController {
  @Post("/register")
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
    });

    set.status = 201;
    return { message: "User created successfully", userId: user.id };
  }

  @Post("/login")
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

  @Get("/me")
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
      role: currentUser.role,
      displayName: profile?.displayName,
      bio: profile?.bio,
    };
  }
}
