import { db } from "./index";
import { seed } from "./seed";
import { logger } from "../utils/logger";

/**
 * Checks if the database needs seeding and auto-seeds if necessary
 * This runs automatically on server startup
 */
export async function autoSeed() {
  try {
    // Check if any admin users exist
    const adminUsers = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.role, "ADMIN"),
    });

    if (!adminUsers) {
      logger.info("🌱 No admin users found. Auto-seeding database...");
      
      // Run seed in silent mode (don't show credentials in logs)
      const result = await seed(true);
      
      if (result.success) {
        logger.info(`✅ Auto-seed complete! Admin user created: ${result.adminEmail}`);
        logger.info("📝 Use the credentials from your .env file to login");
      }
    } else {
      logger.debug("✓ Database already seeded (admin user exists)");
    }
  } catch (error) {
    // Don't crash the server if auto-seed fails
    // The user can still manually run db:seed
    logger.error("❌ Auto-seed failed:", error);
    logger.info("💡 You can manually seed the database with: bun run db:seed");
  }
}
