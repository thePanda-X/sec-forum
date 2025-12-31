import { config } from "dotenv";
import { join } from "path";

config({ path: join(process.cwd(), "../.env") });

import { db } from "./index";
import { users, profiles } from "./schema";
import { hashPassword } from "../utils/auth";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding database...\n");

  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  console.log(`Creating admin user: ${adminEmail}`);

  const hashedPassword = await hashPassword(adminPassword);

  const existingAdmin = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, adminEmail),
  });

  if (existingAdmin) {
    console.log("Admin user already exists, updating password...");
    await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, existingAdmin.id));
    console.log("Admin password updated!");
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
      bio: "System administrator account",
    });

    console.log(`Admin user created with ID: ${admin.id}`);
  }

  console.log("\n✅ Seeding complete!");
  console.log(`\n📝 Admin credentials:`);
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
  console.log(`\n⚠️  Change these values in .env for production!`);
}

seed().catch(console.error);
