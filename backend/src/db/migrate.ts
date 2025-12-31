import "dotenv/config";
import { db } from "./index";

async function migrate() {
  console.log("Running migrations...");
  // Drizzle Kit handles migrations, this file is for runtime migrations if needed
  console.log("Migrations completed!");
}

migrate().catch(console.error);
