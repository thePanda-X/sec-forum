import { config } from "dotenv";
import { join } from "path";

config({ path: join(process.cwd(), "../.env") });

import { db, closeDb } from "./index";

async function push() {
  try {
    // Test the connection
    console.log("🔗 Testing database connection...");
    
    // Run a simple query to verify connection
    const result = await db.execute("SELECT 1 as test");
    
    if (result) {
      console.log("✅ Database connection successful!");
      console.log("💡 To apply schema changes, run: bunx drizzle-kit push");
    }
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  } finally {
    await closeDb();
  }
}

push();
