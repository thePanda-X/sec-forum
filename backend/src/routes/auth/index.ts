import "reflect-metadata";
import { Controller, Post, Get } from "elysia-decorators";
import { db } from "../../db";
import { users, profiles } from "../../db/schema";
import { eq } from "drizzle-orm";

@Controller("/auth")
export class AuthController {
  @Post("/login", {
    detail: {
      tags: ["Auth"],
      summary: "Login user",
      description: "Authenticate user with email and password",
      responses: {
        200: { description: "Login successful" },
        401: { description: "Invalid credentials" },
      },
    },
  } as any)
  async login({ body, jwt, cookie, set }: any) {
    const { email, password } = body;

    if (!email || !password) {
      set.status = 400;
      return { message: "Email and password are required" };
    }

    // Find user by email
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
      with: {
        profile: true,
      },
    });

    if (!user) {
      set.status = 401;
      return { message: "Invalid email or password" };
    }

    // Verify password using Bun's built-in password hashing
    const isValidPassword = await Bun.password.verify(password, user.password);

    if (!isValidPassword) {
      set.status = 401;
      return { message: "Invalid email or password" };
    }

    // Generate JWT token
    const token = await jwt.sign({
      sub: user.id.toString(),
      email: user.email,
      role: user.role,
    });

    // Set cookie
    cookie.auth_token.set({
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return {
      user: {
        id: user.id.toString(),
        email: user.email,
        name: user.profile?.displayName || user.profile?.username || user.email.split("@")[0],
        role: user.role.toLowerCase(),
        avatar: user.profile?.avatar || undefined,
      },
    };
  }

  @Get("/me", {
    detail: {
      tags: ["Auth"],
      summary: "Get current user",
      description: "Get the currently authenticated user",
      responses: {
        200: { description: "User data returned" },
        401: { description: "Not authenticated" },
      },
    },
  } as any)
  async me({ user, set }: any) {
    if (!user) {
      set.status = 401;
      return { message: "Not authenticated" };
    }

    // Get full user data with profile
    const fullUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      with: {
        profile: true,
      },
    });

    if (!fullUser) {
      set.status = 401;
      return { message: "User not found" };
    }

    return {
      user: {
        id: fullUser.id.toString(),
        email: fullUser.email,
        name: fullUser.profile?.displayName || fullUser.profile?.username || fullUser.email.split("@")[0],
        role: fullUser.role.toLowerCase(),
        avatar: fullUser.profile?.avatar || undefined,
      },
    };
  }

  @Post("/logout", {
    detail: {
      tags: ["Auth"],
      summary: "Logout user",
      description: "Logout the currently authenticated user",
      responses: {
        200: { description: "Logout successful" },
      },
    },
  } as any)
  async logout({ cookie, set }: any) {
    if (cookie && cookie.auth_token) {
      cookie.auth_token.remove();
    }

    return { message: "Logout successful" };
  }

  @Post("/register", {
    detail: {
      tags: ["Auth"],
      summary: "Register new user",
      description: "Create a new user account",
      responses: {
        201: { description: "User created" },
        400: { description: "Invalid input" },
        409: { description: "Email already exists" },
      },
    },
  } as any)
  async register({ body, jwt, cookie, set }: any) {
    const { email, password, name } = body;

    if (!email || !password) {
      set.status = 400;
      return { message: "Email and password are required" };
    }

    // Check if email already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      set.status = 409;
      return { message: "Email already exists" };
    }

    // Hash password
    const hashedPassword = await Bun.password.hash(password, {
      algorithm: "bcrypt",
      cost: 10,
    });

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        role: "USER",
      })
      .returning();

    // Create profile
    const username = name || email.split("@")[0];
    await db.insert(profiles).values({
      userId: newUser.id,
      displayName: name || username,
      username: `${username}_${newUser.id}`, // Ensure unique username
    });

    // Generate JWT token
    const token = await jwt.sign({
      sub: newUser.id.toString(),
      email: newUser.email,
      role: newUser.role,
    });

    // Set cookie
    cookie.auth_token.set({
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    set.status = 201;
    return {
      user: {
        id: newUser.id.toString(),
        email: newUser.email,
        name: name || username,
        role: "user",
      },
    };
  }
}
