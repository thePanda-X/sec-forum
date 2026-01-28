import { config } from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Get project root reliably - works from any directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "../../..");

config({ path: join(projectRoot, ".env") });

import { db } from "./index";
import { users, profiles, categories } from "./schema";
import { hashPassword } from "../utils/auth";
import { eq } from "drizzle-orm";

/**
 * Prompts user for input in interactive mode
 */
async function promptUser(question: string, defaultValue: string): Promise<string> {
  // Check if running in interactive terminal
  if (!process.stdin.isTTY) {
    return defaultValue;
  }

  const readline = await import("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${question} [${defaultValue}]: `, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultValue);
    });
  });
}

/**
 * Validates database is ready for seeding
 */
async function validateDatabase(): Promise<boolean> {
  try {
    // Check if database connection works by querying users table
    await db.query.users.findFirst();
    return true;
  } catch (error) {
    console.error("❌ Database validation failed:", error);
    console.error("   Make sure migrations have been run: bun run db:migrate");
    return false;
  }
}

/**
 * Seeds admin user and default categories
 * Can be run multiple times safely (idempotent)
 */
export async function seed(silent: boolean = false) {
  const log = silent ? () => {} : console.log;
  
  try {
    log("🌱 Seeding database...\n");

    // Validate database is ready
    const isReady = await validateDatabase();
    if (!isReady) {
      throw new Error("Database is not ready for seeding");
    }

    // Get admin credentials from environment or prompt
    let adminEmail = process.env.ADMIN_EMAIL;
    let adminPassword = process.env.ADMIN_PASSWORD;

    // Interactive prompts if credentials are missing and running in TTY
    if (!adminEmail && process.stdin.isTTY) {
      log("⚠️  ADMIN_EMAIL not found in .env\n");
      adminEmail = await promptUser("Enter admin email", "admin@example.com");
    } else if (!adminEmail) {
      adminEmail = "admin@example.com";
      log("⚠️  ADMIN_EMAIL not set, using default: admin@example.com");
    }

    if (!adminPassword && process.stdin.isTTY) {
      log("⚠️  ADMIN_PASSWORD not found in .env\n");
      adminPassword = await promptUser("Enter admin password", "admin123");
    } else if (!adminPassword) {
      adminPassword = "admin123";
      log("⚠️  ADMIN_PASSWORD not set, using default: admin123");
    }

    // Validate password strength
    if (adminPassword.length < 6) {
      log("⚠️  WARNING: Admin password is very weak! Consider using a stronger password.");
    }

    log(`Creating admin user: ${adminEmail}`);

    const hashedPassword = await hashPassword(adminPassword);

    const existingAdmin = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, adminEmail),
    });

    if (existingAdmin) {
      log("✓ Admin user already exists, updating password...");
      await db
        .update(users)
        .set({ password: hashedPassword, updatedAt: new Date() })
        .where(eq(users.id, existingAdmin.id));
      log("✓ Admin password updated!");
    } else {
      const [admin] = await db
        .insert(users)
        .values({
          email: adminEmail,
          password: hashedPassword,
          role: "ADMIN",
        })
        .returning({ id: users.id, email: users.email });

      await db.insert(profiles).values({
        userId: admin.id,
        displayName: "Administrator",
        username: "admin",
        bio: "System administrator account",
      });

      log(`✓ Admin user created with ID: ${admin.id}`);
    }

    log("\n🌿 Seeding categories...");

    const defaultCategories = [
      { name: "Threat Intelligence", slug: "threat-intelligence", description: "Discuss threat actors, IOCs, and threat analysis", color: "#ef4444" },
      { name: "Penetration Testing", slug: "penetration-testing", description: "Pen testing methodologies, tools, and write-ups", color: "#f97316" },
      { name: "Malware Analysis", slug: "malware-analysis", description: "Reverse engineering and malware analysis techniques", color: "#eab308" },
      { name: "Network Security", slug: "network-security", description: "Network defense, monitoring, and segmentation", color: "#22c55e" },
      { name: "Cryptography", slug: "cryptography", description: "Encryption, hashing, and cryptographic protocols", color: "#06b6d4" },
      { name: "Phishing", slug: "phishing", description: "Phishing techniques, prevention, and analysis", color: "#8b5cf6" },
    ];

    let categoriesAdded = 0;
    let categoriesExisting = 0;

    for (const category of defaultCategories) {
      const existing = await db.query.categories.findFirst({
        where: (categories, { eq }) => eq(categories.slug, category.slug),
      });

      if (existing) {
        log(`  ✓ Category "${category.name}" already exists`);
        categoriesExisting++;
      } else {
        await db.insert(categories).values(category);
        log(`  → Added category: ${category.name}`);
        categoriesAdded++;
      }
    }

    log("\n✅ Seeding complete!");
    log(`\n📊 Summary:`);
    log(`   Admin user: ${adminEmail}`);
    log(`   Categories added: ${categoriesAdded}`);
    log(`   Categories existing: ${categoriesExisting}`);
    
    if (!silent) {
      log(`\n📝 Admin credentials:`);
      log(`   Email: ${adminEmail}`);
      log(`   Password: ${adminPassword}`);
      log(`\n⚠️  Change these values in .env for production!`);
    }

    return { success: true, adminEmail };
  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    throw error;
  }
}

// Only run if called directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  seed().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
