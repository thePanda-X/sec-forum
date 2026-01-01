import { config } from "dotenv";
import { join } from "path";
import { readFileSync, readdirSync } from "fs";

config({ path: join(process.cwd(), "../.env") });

import { Database } from "bun:sqlite";

const DATABASE_URL = process.env.DATABASE_URL || "./forum.db";

async function migrate() {
  console.log("🔄 Running database migrations...");

  const db = new Database(DATABASE_URL, { create: true });

  // Get all migration files
  const migrationsDir = join(process.cwd(), "migrations");
  const files = readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  // Create a migrations table if it doesn't exist
  const hasMigrationsTable = db
    .query("SELECT name FROM sqlite_master WHERE type='table' AND name='__drizzle_migrations'")
    .get();

  if (!hasMigrationsTable) {
    db.run(`
      CREATE TABLE IF NOT EXISTS __drizzle_migrations (
        hash TEXT PRIMARY KEY,
        created_at INTEGER
      )
    `);
  }

  // Run migrations that haven't been run yet
  let appliedCount = 0;
  for (const file of files) {
    const hash = file.replace(".sql", "");
    const existing = db
      .query("SELECT hash FROM __drizzle_migrations WHERE hash = ?")
      .get(hash);

    if (existing) {
      console.log(`  ✓ Migration ${hash} already applied, skipping`);
      continue;
    }

    console.log(`  → Applying migration: ${hash}`);
    const migrationPath = join(migrationsDir, file);
    const migrationSql = readFileSync(migrationPath, "utf-8");

    try {
      // Split migration SQL by statement-breakpoint comments
      const statements = migrationSql
        .split("--> statement-breakpoint")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const statement of statements) {
        db.exec(statement);
      }

      db.run("INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)", [
        hash,
        Date.now(),
      ]);

      appliedCount++;
      console.log(`  ✓ Migration ${hash} applied successfully`);
    } catch (error) {
      console.error(`  ✗ Migration ${hash} failed:`, error);
      throw error;
    }
  }

  db.close();
  console.log(`✅ All migrations completed! ${appliedCount} new migration(s) applied.`);
}

await migrate();
