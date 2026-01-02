import { Database } from "bun:sqlite";

const db = new Database("./forum.db");

const profileCols = db.query("PRAGMA table_info(profiles)").all();
const settingsCols = db.query("PRAGMA table_info(user_settings)").all();

console.log("Profile columns:", JSON.stringify(profileCols, null, 2));
console.log("\nUser settings columns:", JSON.stringify(settingsCols, null, 2));
