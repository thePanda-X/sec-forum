import { config } from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync, writeFileSync } from "fs";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "../../..");

const envPath = join(projectRoot, ".env");

function generateRandomSecret(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function ensureEnvFile(): void {
  if (!existsSync(envPath)) {
    console.log("   → Creating .env file with sensible defaults...");
    const defaultEnv = `# Database Configuration
DATABASE_URL=./forum.db

# Server Configuration
PORT=3000
LOG_LEVEL=DEBUG
NODE_ENV=development

# JWT Secret (auto-generated during deploy)
JWT_SECRET=${generateRandomSecret()}

# Admin Credentials (CHANGE THESE FOR PRODUCTION!)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
`;
    writeFileSync(envPath, defaultEnv);
    console.log("   ✓ .env file created!");
  } else {
    console.log("   ✓ .env file exists");
  }
}

function validateAndSetDefaults(): { adminEmail: string; adminPassword: string } {
  if (!process.env.JWT_SECRET) {
    const secret = generateRandomSecret();
    console.log("   ⚠️  JWT_SECRET not set, generating random secret...");
    process.env.JWT_SECRET = secret;
  }

  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    console.log("   ⚠️  Using default admin credentials:");
    console.log("      Email: admin@example.com");
    console.log("      Password: admin123");
  }

  if (adminPassword === "admin123") {
    console.log("   ⚠️  WARNING: Using weak default password!");
    console.log("      Update ADMIN_PASSWORD in .env for production!");
  }

  return { adminEmail, adminPassword };
}

async function syncSchema(): Promise<void> {
  console.log("\n📦 Step 2: Syncing database schema...");
  console.log("   → Running drizzle-kit push...");
  
  try {
    execSync("bunx drizzle-kit push", {
      cwd: projectRoot,
      stdio: "inherit",
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL || "./forum.db"
      }
    });
    console.log("   ✓ Database schema synced!");
  } catch (error) {
    console.error("   ❌ Schema sync failed:", error);
    throw error;
  }
}

async function validateDatabase(): Promise<boolean> {
  try {
    const { db } = await import("./index");
    await db.query.users.findFirst();
    return true;
  } catch (error) {
    console.error("❌ Database validation failed:", error);
    return false;
  }
}

async function seedDatabase(silent: boolean = false): Promise<{ success: boolean; adminEmail: string }> {
  try {
    const { seed } = await import("./seed");
    return await seed(silent);
  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    throw error;
  }
}

async function deploy(): Promise<void> {
  console.log("🚀 Deploying SEC Forum Backend...\n");

  try {
    console.log("📄 Step 1: Checking environment configuration...");
    ensureEnvFile();
    config({ path: envPath });
    const { adminEmail, adminPassword } = validateAndSetDefaults();

    await syncSchema();

    console.log("\n🌱 Step 3: Seeding database...");
    await seedDatabase(false);

    console.log("\n" + "=".repeat(60));
    console.log("✅ Deployment complete! Your backend is ready.");
    console.log("=".repeat(60));
    console.log("\n📝 Admin credentials:");
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log("\n⚠️  Change these values in .env for production!");
    console.log("\n📚 Next steps:");
    console.log("   1. Start the server: bun run start");
    console.log("   2. Access the API at: http://localhost:3000");
    console.log("   3. View API docs at: http://localhost:3000/api/v1/docs");
    console.log("");
  } catch (error) {
    console.error("\n" + "=".repeat(60));
    console.error("❌ Deployment failed!");
    console.error("=".repeat(60));
    console.error("\n💡 Troubleshooting:");
    console.error("   - Make sure you're in the backend directory");
    console.error("   - Check that dependencies are installed: bun install");
    console.error("   - Verify DATABASE_URL is correct in .env");
    console.error("   - Try running steps manually:");
    console.error("     • bunx drizzle-kit push");
    console.error("     • bun run db:seed");
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  deploy();
}

export { deploy };
