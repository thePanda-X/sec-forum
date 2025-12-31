import { config } from "dotenv";
import { join } from "path";

config({ path: join(process.cwd(), "../.env") });

import { Database } from "bun:sqlite";

const sqlite = new Database(process.env.DATABASE_URL || "./forum.db");
sqlite.run("PRAGMA journal_mode = WAL");
console.log("Database schema pushed!");
