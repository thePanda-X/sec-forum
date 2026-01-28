import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = join(__dirname, ".env");
const envExamplePath = join(__dirname, ".env.example");

function loadEnv(override: boolean = false): void {
  if (!existsSync(envPath)) {
    return;
  }

  const content = readFileSync(envPath, "utf-8");
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const [key, ...valueParts] = trimmed.split("=");
    const value = valueParts.join("=");

    if (key && value !== undefined) {
      if (override || process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

loadEnv(false);

function generateRandomSecret(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function promptUser(question: string): Promise<string> {
  if (!process.stdin.isTTY) {
    throw new Error("Interactive input required. Set ADMIN_EMAIL and ADMIN_PASSWORD in .env");
  }

  const readline = await import("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${question}: `, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function promptPassword(question: string): Promise<string> {
  if (!process.stdin.isTTY) {
    throw new Error("Interactive input required. Set ADMIN_EMAIL and ADMIN_PASSWORD in .env");
  }

  const readline = await import("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${question}: `, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function confirmPrompt(message: string): Promise<boolean> {
  if (!process.stdin.isTTY) {
    return false;
  }

  const readline = await import("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${message} (yes/no): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "yes" || answer.toLowerCase() === "y");
    });
  });
}

async function setupEnvFile(): Promise<{ adminEmail: string; adminPassword: string }> {
  if (!existsSync(envPath)) {
    console.log("📄 .env file not found, creating from .env.example...");
    
    if (!existsSync(envExamplePath)) {
      throw new Error(".env.example not found!");
    }

    const envContent = readFileSync(envExamplePath, "utf-8");
    writeFileSync(envPath, envContent);
    console.log("✓ .env file created from .env.example");
    loadEnv();
  } else {
    console.log("✓ .env file exists");
  }

  if (!process.env.JWT_SECRET) {
    const secret = generateRandomSecret();
    const envContent = readFileSync(envPath, "utf-8");
    const newEnvContent = envContent.replace(
      /^JWT_SECRET=.*$/m,
      `JWT_SECRET=${secret}`
    );
    writeFileSync(envPath, newEnvContent);
    console.log("✓ Generated new JWT_SECRET");
    process.env.JWT_SECRET = secret;
  }

  let adminEmail = process.env.ADMIN_EMAIL;
  let adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail) {
    console.log("\n📧 Admin email not set in .env");
    adminEmail = await promptUser("Enter admin email");
    
    const envContent = readFileSync(envPath, "utf-8");
    const newEnvContent = envContent.replace(
      /^ADMIN_EMAIL=.*$/m,
      `ADMIN_EMAIL=${adminEmail}`
    );
    writeFileSync(envPath, newEnvContent);
    console.log("✓ Saved admin email to .env");
    loadEnv();
  }

  if (!adminPassword) {
    console.log("\n🔑 Admin password not set in .env");
    adminPassword = await promptPassword("Enter admin password");
    
    if (adminPassword.length < 8) {
      throw new Error("Password must be at least 8 characters long");
    }

    if (adminPassword === "admin123") {
      const confirm = await confirmPrompt("Weak password detected. Continue anyway?");
      if (!confirm) {
        process.exit(0);
      }
    }

    const envContent = readFileSync(envPath, "utf-8");
    const newEnvContent = envContent.replace(
      /^ADMIN_PASSWORD=.*$/m,
      `ADMIN_PASSWORD=${adminPassword}`
    );
    writeFileSync(envPath, newEnvContent);
    console.log("✓ Saved admin password to .env");
    loadEnv();
  }

  if (adminPassword === "admin123") {
    console.warn("\n⚠️  WARNING: Using default weak password 'admin123'!");
  }

  return { adminEmail, adminPassword };
}

async function wipeDatabase(): Promise<void> {
  const dbPath = process.env.DATABASE_URL?.replace(/^\.\//, "") || "forum.db";
  const fullDbPath = join(__dirname, "backend", dbPath);

  if (!existsSync(fullDbPath)) {
    console.log("✓ No existing database found");
    return;
  }

  console.log(`\n⚠️  Database file found: ${dbPath}`);
  console.log("⚠️  This will DELETE ALL DATA in the database!");
  
  const confirmed = await confirmPrompt("Are you sure you want to proceed?");
  
  if (!confirmed) {
    console.log("\n❌ Deployment cancelled");
    process.exit(0);
  }

  unlinkSync(fullDbPath);
  console.log(`✓ Database deleted: ${dbPath}`);
}

async function runMigrations(): Promise<void> {
  console.log("\n📦 Running database migrations...");

  const migrationsDir = join(__dirname, "backend", "migrations");
  const { readdirSync, readFileSync } = await import("fs");
  
  const files = readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    throw new Error("No migration files found in backend/migrations/");
  }

  const { Database } = await import("bun:sqlite");
  const dbPath = process.env.DATABASE_URL?.replace(/^\.\//, "") || "forum.db";
  const fullDbPath = join(__dirname, "backend", dbPath);
  const db = new Database(fullDbPath, { create: true });

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

  let appliedCount = 0;
  for (const file of files) {
    const hash = file.replace(".sql", "");
    const existing = db
      .query("SELECT hash FROM __drizzle_migrations WHERE hash = ?")
      .get(hash);

    if (existing) {
      console.log(`  ✓ Migration ${hash} already applied`);
      continue;
    }

    console.log(`  → Applying: ${hash}`);
    const migrationPath = join(migrationsDir, file);
    const migrationSql = readFileSync(migrationPath, "utf-8");

    try {
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
      console.log(`  ✓ Applied: ${hash}`);
    } catch (error) {
      db.close();
      console.error(`  ✗ Migration ${hash} failed:`, error);
      throw error;
    }
  }

  db.close();
  console.log(`✓ ${appliedCount} migration(s) applied`);
}

async function seedDatabase(): Promise<void> {
  console.log("\n🌱 Seeding database...");

  const { Database } = await import("bun:sqlite");
  const dbPath = process.env.DATABASE_URL?.replace(/^\.\//, "") || "forum.db";
  const fullDbPath = join(__dirname, "backend", dbPath);
  
  const db = new Database(fullDbPath);
  
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  const { hashPassword } = await import(join(__dirname, "backend", "src", "utils", "auth.ts"));
  const hashedPassword = await hashPassword(adminPassword);

  const existingAdmin = db.query("SELECT id FROM users WHERE email = ?").get(adminEmail) as { id: number } | undefined;

  if (!existingAdmin) {
    console.log(`   → Creating admin user: ${adminEmail}`);
    
    const now = Date.now();
    const result = db.run("INSERT INTO users (email, password, role, created_at, updated_at) VALUES (?, ?, 'ADMIN', ?, ?)", 
      [adminEmail, hashedPassword, now, now]);
    
    const userId = Number(result.lastInsertRowid);
    
    if (isNaN(userId) || userId === 0) {
      throw new Error("Failed to insert user - invalid ID returned");
    }
    
    console.log(`   → User ID: ${userId}`);
    
    db.run("INSERT INTO profiles (user_id, display_name, username, bio) VALUES (?, 'Administrator', 'admin', 'System administrator account')",
      [userId]);
    
    console.log(`✓ Admin user created: ${adminEmail}`);
  } else {
    db.run("UPDATE users SET password = ?, updated_at = ? WHERE id = ?", [hashedPassword, Date.now(), existingAdmin.id]);
    console.log(`✓ Admin password updated: ${adminEmail}`);
  }

  const defaultCategories = [
    { name: "Threat Intelligence", slug: "threat-intelligence", description: "Discuss threat actors, IOCs, and threat analysis", color: "#ef4444" },
    { name: "Penetration Testing", slug: "penetration-testing", description: "Pen testing methodologies, tools, and write-ups", color: "#f97316" },
    { name: "Malware Analysis", slug: "malware-analysis", description: "Reverse engineering and malware analysis techniques", color: "#eab308" },
    { name: "Network Security", slug: "network-security", description: "Network defense, monitoring, and segmentation", color: "#22c55e" },
    { name: "Cryptography", slug: "cryptography", description: "Encryption, hashing, and cryptographic protocols", color: "#06b6d4" },
    { name: "Phishing", slug: "phishing", description: "Phishing techniques, prevention, and analysis", color: "#8b5cf6" },
  ];

  let categoriesAdded = 0;
  for (const category of defaultCategories) {
    const existing = db.query("SELECT id FROM categories WHERE slug = ?").get(category.slug) as { id: number } | undefined;

    if (!existing) {
      db.run("INSERT INTO categories (name, slug, description, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
        [category.name, category.slug, category.description, category.color, Date.now(), Date.now()]);
      categoriesAdded++;
    }
  }

  console.log(`✓ ${categoriesAdded} categories created`);
  db.close();
}

async function validateDeployment(): Promise<boolean> {
  console.log("\n✅ Validating deployment...");

  try {
    const { Database } = await import("bun:sqlite");
    const dbPath = process.env.DATABASE_URL?.replace(/^\.\//, "") || "forum.db";
    const fullDbPath = join(__dirname, "backend", dbPath);
    const db = new Database(fullDbPath);

    const userCount = db.query("SELECT COUNT(*) as count FROM users").get() as { count: number };
    const categoryCount = db.query("SELECT COUNT(*) as count FROM categories").get() as { count: number };

    db.close();

    if (!userCount || userCount.count === 0) {
      throw new Error("No users found in database");
    }

    if (!categoryCount || categoryCount.count === 0) {
      throw new Error("No categories found in database");
    }

    console.log(`✓ Found ${userCount.count} user(s)`);
    console.log(`✓ Found ${categoryCount.count} categor(y/ies)`);
    return true;
  } catch (error) {
    console.error("✗ Validation failed:", error);
    return false;
  }
}

async function deploy(): Promise<void> {
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║  SEC FORUM - Production Database Deployment Script    ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  try {
    const { adminEmail, adminPassword } = await setupEnvFile();
    
    console.log("\n" + "─".repeat(60));
    console.log("📋 Deployment Summary:");
    console.log(`   Admin Email: ${adminEmail}`);
    console.log(`   Database: ${process.env.DATABASE_URL || "./forum.db"}`);
    console.log("─".repeat(60));

    await wipeDatabase();
    await runMigrations();
    await seedDatabase();
    
    const isValid = await validateDeployment();

    if (!isValid) {
      throw new Error("Deployment validation failed");
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ DEPLOYMENT SUCCESSFUL!");
    console.log("=".repeat(60));
    console.log("\n📝 Admin Credentials:");
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log("\n⚠️  Keep these credentials safe!");
    console.log("\n📚 Next Steps:");
    console.log("   1. Start backend: bun run dev:backend");
    console.log("   2. Start frontend: bun run dev:frontend");
    console.log("   3. Or run both: bun run dev");
    console.log("\n🔗 API Documentation:");
    console.log("   http://localhost:3000/api/v1/docs");
    console.log("");
  } catch (error) {
    console.error("\n" + "=".repeat(60));
    console.error("❌ DEPLOYMENT FAILED!");
    console.error("=".repeat(60));
    console.error("\nError:", error);
    console.error("\n💡 Troubleshooting:");
    console.error("   • Check .env configuration");
    console.error("   • Ensure database file is not locked");
    console.error("   • Verify migrations exist in backend/migrations/");
    console.error("   • Try running manually:");
    console.error("     - bun run backend/src/db/migrate.ts");
    console.error("     - bun run backend/src/db/seed.ts");
    process.exit(1);
  }
}

deploy();
