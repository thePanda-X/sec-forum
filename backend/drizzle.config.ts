import type { Config } from "drizzle-kit";
import { config } from "dotenv";
import { join } from "path";

config({ path: join(process.cwd(), "../.env") });

export default {
  schema: "./src/db/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgres://localhost:5432/secforum",
  },
} satisfies Config;
