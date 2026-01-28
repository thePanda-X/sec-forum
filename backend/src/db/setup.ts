import { config } from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync, copyFileSync } from "fs";

// Get project root reliably
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "../../..");

const envPath = join(projectRoot, ".env");
const envExamplePath = join(projectRoot, ".env.example");

/**
 * Complete first-time setup script
 * Handles .env creation, migrations, and seeding
 */
async function setup() {
  console.log("🚀 Setting up SEC Forum Backend...\n");

  // Step 1: Check/create .env file
  console.log("📄 Step 1: Checking environment configuration...");
  if (!existsSync(envPath)) {
    if (existsSync(envExamplePath)) {
      console.log("   → Creating .env from .env.example...");
      copyFileSync(envExamplePath, envPath);
      console.log("   ✓ .env file created!");
      console.log("   ⚠️  Please review and update .env with your configuration");
    } else {
      console.error("   ❌ .env.example not found!");
      throw new Error(".env.example file is missing");
    }
  } else {
    console.log("   ✓ .env file exists");
  }

  // Load environment variables
  config({ path: envPath });

  // Step 2: Run migrations
  console.log("\n📦 Step 2: Running database migrations...");
  try {
    await import("./migrate");
    console.log("   ✓ Migrations complete!");
  } catch (error) {
    console.error("   ❌ Migration failed:", error);
    throw error;
  }

  // Step 3: Seed database
  console.log("\n🌱 Step 3: Seeding database...");
  try {
    const { seed } = await import("./seed");
    await seed(false);
  } catch (error) {
    console.error("   ❌ Seeding failed:", error);
    throw error;
  }

  // Success message
  console.log("\n" + "=".repeat(60));
  console.log("✅ Setup complete! Your backend is ready to use.");
  console.log("=".repeat(60));
  console.log("\n📚 Next steps:");
  console.log("   1. Review your .env file and update any configuration");
  console.log("   2. Start the development server: bun run dev");
  console.log("   3. Access the API at: http://localhost:3000");
  console.log("   4. View API docs at: http://localhost:3000/api/v1/docs");
  console.log("\n💡 Tip: You can re-seed anytime with: bun run db:seed");
  console.log("");
}

// Run setup
setup().catch((error) => {
  console.error("\n❌ Setup failed:", error);
  console.error("\n💡 Troubleshooting:");
  console.error("   - Make sure you're in the backend directory");
  console.error("   - Check that all dependencies are installed: bun install");
  console.error("   - Try running steps manually:");
  console.error("     • bun run db:migrate");
  console.error("     • bun run db:seed");
  process.exit(1);
});
