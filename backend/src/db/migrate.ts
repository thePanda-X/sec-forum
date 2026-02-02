import { config } from "dotenv";
import { join } from "path";

config({ path: join(process.cwd(), "../.env") });

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL || "postgres://localhost:5432/secforum";

async function runMigrations() {
  console.log("🔄 Running database migrations...");
  console.log(`📦 Connecting to database...`);

  // Create a migration-specific connection
  const migrationClient = postgres(connectionString, { max: 1 });
  const db = drizzle(migrationClient);

  try {
    // Run migrations using drizzle-kit generated migrations
    await migrate(db, { migrationsFolder: join(process.cwd(), "migrations") });
    console.log("✅ All migrations completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await migrationClient.end();
  }
}

await runMigrations();
