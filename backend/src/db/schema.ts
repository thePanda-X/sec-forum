import { pgTable, text, integer, serial, boolean, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const UserRole = {
  ADMIN: "ADMIN",
  MODERATOR: "MODERATOR",
  USER: "USER",
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["ADMIN", "MODERATOR", "USER"] })
    .notNull()
    .default("USER"),
  isBanned: boolean("is_banned").notNull().default(false),
  lastSeen: timestamp("last_seen"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date()),
});

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull(),
  username: text("username").notNull().unique(),
  avatar: text("avatar"),
  bio: text("bio"),
  location: text("location"),
  website: text("website"),
  githubUsername: text("github_username"),
  twitterHandle: text("twitter_handle"),
  skills: text("skills"),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  categoryId: integer("category_id")
    .references(() => categories.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  body: text("body").notNull(),
  pinned: boolean("pinned").notNull().default(false),
  locked: boolean("locked").notNull().default(false),
  views: integer("views").notNull().default(0),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date()),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  authorId: integer("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  parentId: integer("parent_id"),
  body: text("body").notNull(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date()),
});

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const postTags = pgTable(
  "post_tags",
  {
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.postId, table.tagId] }),
  })
);

export const postVotes = pgTable(
  "post_votes",
  {
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    value: integer("value").notNull(),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.postId, table.userId] }),
  })
);

export const postViews = pgTable(
  "post_views",
  {
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    viewedAt: timestamp("viewed_at")
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.postId, table.userId] }),
  })
);

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  postId: integer("post_id").references(() => posts.id, { onDelete: "cascade" }),
  actorUserId: integer("actor_user_id").references(() => users.id, { onDelete: "cascade" }),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date()),
});

export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  emailNotifications: boolean("email_notifications")
    .notNull()
    .default(true),
  pushNotifications: boolean("push_notifications")
    .notNull()
    .default(true),
  theme: text("theme", { enum: ["light", "dark"] })
    .notNull()
    .default("light"),
  fontSize: text("font_size", { enum: ["small", "medium", "large"] })
    .notNull()
    .default("medium"),
  compactMode: boolean("compact_mode")
    .notNull()
    .default(false),
  language: text("language", { enum: ["en", "es"] })
    .notNull()
    .default("en"),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  reporterId: integer("reporter_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  targetType: text("target_type").notNull(),
  targetId: integer("target_id").notNull(),
  reason: text("reason").notNull(),
  status: text("status", { enum: ["PENDING", "REVIEWED", "RESOLVED", "DISMISSED"] })
    .notNull()
    .default("PENDING"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date()),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  color: text("color").notNull().default("#10b981"),
  icon: text("icon").notNull().default("FolderTree"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date()),
});

export const followers = pgTable(
  "followers",
  {
    followerId: integer("follower_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    followingId: integer("following_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.followerId, table.followingId] }),
  })
);

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id").notNull(),
  details: text("details"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date()),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  postVotes: many(postVotes),
  postViews: many(postViews),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [posts.categoryId],
    references: [categories.id],
  }),
  postTags: many(postTags),
  postVotes: many(postVotes),
  postViews: many(postViews),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  postTags: many(postTags),
}));

export const postTagsRelations = relations(postTags, ({ one }) => ({
  post: one(posts, {
    fields: [postTags.postId],
    references: [posts.id],
  }),
  tag: one(tags, {
    fields: [postTags.tagId],
    references: [tags.id],
  }),
}));

export const postVotesRelations = relations(postVotes, ({ one }) => ({
  post: one(posts, {
    fields: [postVotes.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [postVotes.userId],
    references: [users.id],
  }),
}));

export const postViewsRelations = relations(postViews, ({ one }) => ({
  post: one(posts, {
    fields: [postViews.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [postViews.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [notifications.postId],
    references: [posts.id],
  }),
  actor: one(users, {
    fields: [notifications.actorUserId],
    references: [users.id],
  }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  reporter: one(users, {
    fields: [reports.reporterId],
    references: [users.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  posts: many(posts),
}));

export const followersRelations = relations(followers, ({ one }) => ({
  follower: one(users, {
    fields: [followers.followerId],
    references: [users.id],
  }),
  following: one(users, {
    fields: [followers.followingId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
export type PostVote = typeof postVotes.$inferSelect;
export type NewPostVote = typeof postVotes.$inferInsert;
export type PostView = typeof postViews.$inferSelect;
export type NewPostView = typeof postViews.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type UserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;
export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Follower = typeof followers.$inferSelect;
export type NewFollower = typeof followers.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
