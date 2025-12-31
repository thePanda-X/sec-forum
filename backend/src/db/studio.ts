import "dotenv/config";
import { db } from "./index";
import { users, profiles, posts, tags, postTags } from "./schema";
import { desc } from "drizzle-orm";

async function main() {
  console.log("=== SEC Forum Database Studio ===\n");

  console.log("--- Users ---");
  const allUsers = await db.query.users.findMany({
    with: {
      profile: true,
    },
    orderBy: [desc(users.createdAt)],
  });
  console.table(allUsers.map((u) => ({
    id: u.id,
    email: u.email,
    role: u.role,
    displayName: u.profile?.displayName,
  })));

  console.log("\n--- Posts ---");
  const allPosts = await db.query.posts.findMany({
    with: {
      author: {
        with: { profile: true },
      },
      postTags: {
        with: { tag: true },
      },
    },
    orderBy: [desc(posts.createdAt)],
  });
  console.table(
    allPosts.map((p) => ({
      id: p.id,
      title: p.title,
      author: p.author.profile?.displayName || p.author.email,
      tags: p.postTags.map((t) => t.tag.name).join(", "),
      createdAt: p.createdAt?.toISOString(),
    }))
  );

  console.log("\n--- Tags ---");
  const allTags = await db.query.tags.findMany({
    orderBy: [tags.name],
  });
  console.table(allTags);
}

main().catch(console.error);
