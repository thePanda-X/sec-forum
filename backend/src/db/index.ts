import { config } from "dotenv";
import { join } from "path";

config({ path: join(process.cwd(), "../.env") });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL || "postgres://localhost:5432/secforum";

// Create postgres connection
const client = postgres(connectionString, {
  max: 10, // Maximum number of connections
  idle_timeout: 20, // Close connections after 20 seconds of inactivity
  connect_timeout: 10, // Connection timeout in seconds
});

export const db = drizzle(client, { schema });

// Export for graceful shutdown
export const closeDb = async () => {
  await client.end();
};
