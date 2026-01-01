import "reflect-metadata";
import { Controller, Post } from "elysia-decorators";

@Controller("/auth")
export class AuthController {
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
}
