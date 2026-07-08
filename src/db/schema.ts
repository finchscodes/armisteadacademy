import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { MAJOR_VALUES } from "@/lib/majors";
import { JOB_VALUES } from "@/lib/roles";

/* -------------------------------------------------------------------------- */
/*  Enums                                                                      */
/* -------------------------------------------------------------------------- */

export const characterJobEnum = pgEnum("character_job", JOB_VALUES);
export const boardKindEnum = pgEnum("board_kind", ["category", "board", "class"]);
export const submissionStatusEnum = pgEnum("submission_status", [
  "open", // posted, awaiting a grader to claim it
  "claimed", // a grader has opted in
  "graded", // grade + payout issued
]);
export const ledgerReasonEnum = pgEnum("ledger_reason", [
  "grading_reward",
  "grading_payment", // what the grader themself earns for grading
  "shop_purchase",
  "admin_adjustment",
  "starting_balance",
]);
export const xpReasonEnum = pgEnum("xp_reason", [
  "chat_post",
  "homework_submission",
  "grading",
  "pet_cuddle",
  "admin_adjustment",
]);
export const characterMajorEnum = pgEnum("character_major", MAJOR_VALUES);

/** Level required before a character is allowed to claim/grade homework. */
export const GRADING_LEVEL_REQUIREMENT = 3;

/* -------------------------------------------------------------------------- */
/*  Users & Characters                                                        */
/* -------------------------------------------------------------------------- */

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    username: varchar("username", { length: 32 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    // Admin is the one account-level permission: every character on an admin's
    // account gets hidden admin access, regardless of the character's job.
    isAdmin: boolean("is_admin").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
    usernameIdx: uniqueIndex("users_username_idx").on(table.username),
  })
);

export const characters = pgTable(
  "characters",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 64 }).notNull(),
    slug: varchar("slug", { length: 80 }).notNull(),
    // Legal name — set once at creation, never editable afterward (enforced in
    // the app layer; there's no DB-level lock since Postgres can't do that).
    firstName: varchar("first_name", { length: 50 }).notNull().default("Unknown"),
    middleName: varchar("middle_name", { length: 50 }),
    lastName: varchar("last_name", { length: 50 }).notNull().default("Unknown"),
    major: characterMajorEnum("major").notNull().default("Undecided/Witness Protection"),
    job: characterJobEnum("job").notNull().default("none"),
    bio: text("bio"),
    avatarUrl: text("avatar_url"),
    isArchived: boolean("is_archived").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    slugIdx: uniqueIndex("characters_slug_idx").on(table.slug),
  })
);

/* -------------------------------------------------------------------------- */
/*  Forum core: Boards / Threads / Posts                                      */
/* -------------------------------------------------------------------------- */

export const boards = pgTable(
  "boards",
  {
    id: serial("id").primaryKey(),
    parentId: integer("parent_id"),
    kind: boardKindEnum("kind").notNull().default("board"),
    name: varchar("name", { length: 120 }).notNull(),
    slug: varchar("slug", { length: 140 }).notNull(),
    description: text("description"),
    position: integer("position").notNull().default(0),
    minRoleToView: text("min_role_to_view").notNull().default("member"),
    minRoleToPost: text("min_role_to_post").notNull().default("member"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    slugIdx: uniqueIndex("boards_slug_idx").on(table.slug),
  })
);

export const threads = pgTable("threads", {
  id: serial("id").primaryKey(),
  boardId: integer("board_id")
    .notNull()
    .references(() => boards.id, { onDelete: "cascade" }),
  characterId: integer("character_id")
    .notNull()
    .references(() => characters.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 220 }).notNull(),
  isLocked: boolean("is_locked").notNull().default(false),
  isPinned: boolean("is_pinned").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastPostAt: timestamp("last_post_at").notNull().defaultNow(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id")
    .notNull()
    .references(() => threads.id, { onDelete: "cascade" }),
  characterId: integer("character_id")
    .notNull()
    .references(() => characters.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  editedAt: timestamp("edited_at"),
});

/** Site-wide sidebar chat — separate from in-character forum threads. */
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  characterId: integer("character_id")
    .notNull()
    .references(() => characters.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: varchar("content", { length: 1000 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* -------------------------------------------------------------------------- */
/*  Lessons & Grading (schema now, UI/API in the next phase)                  */
/* -------------------------------------------------------------------------- */

/**
 * Which characters are assigned to teach which class boards. A character can
 * only post lessons to a class board they're assigned to (admins can post to
 * any). Assigned by admin. One row per (character, class board) pair.
 */
export const classAssignments = pgTable(
  "class_assignments",
  {
    id: serial("id").primaryKey(),
    characterId: integer("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    boardId: integer("board_id")
      .notNull()
      .references(() => boards.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    uniquePair: uniqueIndex("class_assignments_character_board_idx").on(
      table.characterId,
      table.boardId
    ),
  })
);

export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  boardId: integer("board_id")
    .notNull()
    .references(() => boards.id, { onDelete: "cascade" }), // the "class" board this lesson belongs to
  title: varchar("title", { length: 200 }).notNull(),
  prompt: text("prompt").notNull(), // the assignment text
  createdByUserId: integer("created_by_user_id")
    .notNull()
    .references(() => users.id),
  rewardMin: integer("reward_min").notNull().default(10), // currency range for a full-credit grade
  rewardMax: integer("reward_max").notNull().default(25),
  graderFee: integer("grader_fee").notNull().default(5), // what the grader earns per grade
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id")
    .notNull()
    .references(() => lessons.id, { onDelete: "cascade" }),
  characterId: integer("character_id")
    .notNull()
    .references(() => characters.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  status: submissionStatusEnum("status").notNull().default("open"),
  graderCharacterId: integer("grader_character_id").references(() => characters.id),
  grade: integer("grade"), // 0-100
  feedback: text("feedback"),
  payout: integer("payout"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  gradedAt: timestamp("graded_at"),
});

/* -------------------------------------------------------------------------- */
/*  Economy: Ledger / Shops / Items / Inventory                               */
/* -------------------------------------------------------------------------- */

export const currencyLedger = pgTable("currency_ledger", {
  id: serial("id").primaryKey(),
  characterId: integer("character_id")
    .notNull()
    .references(() => characters.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // positive = credit, negative = debit
  reason: ledgerReasonEnum("reason").notNull(),
  relatedSubmissionId: integer("related_submission_id").references(() => submissions.id),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const xpLedger = pgTable("xp_ledger", {
  id: serial("id").primaryKey(),
  characterId: integer("character_id")
    .notNull()
    .references(() => characters.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // always positive; XP doesn't get spent
  reason: xpReasonEnum("reason").notNull(),
  relatedSubmissionId: integer("related_submission_id").references(() => submissions.id),
  relatedPostId: integer("related_post_id").references(() => posts.id),
  relatedPetId: integer("related_pet_id").references(() => pets.id),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pets = pgTable("pets", {
  id: serial("id").primaryKey(),
  characterId: integer("character_id")
    .notNull()
    .references(() => characters.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 64 }).notNull(),
  species: varchar("species", { length: 60 }).notNull(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  lastCuddledAt: timestamp("last_cuddled_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const shops = pgTable("shops", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 140 }).notNull(),
  description: text("description"),
});

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id")
    .notNull()
    .references(() => shops.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  stock: integer("stock"), // null = unlimited
  imageUrl: text("image_url"),
});

export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  characterId: integer("character_id")
    .notNull()
    .references(() => characters.id, { onDelete: "cascade" }),
  itemId: integer("item_id")
    .notNull()
    .references(() => items.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
  acquiredAt: timestamp("acquired_at").notNull().defaultNow(),
});

/* -------------------------------------------------------------------------- */
/*  Relations                                                                  */
/* -------------------------------------------------------------------------- */

export const usersRelations = relations(users, ({ many }) => ({
  characters: many(characters),
}));

export const charactersRelations = relations(characters, ({ one, many }) => ({
  user: one(users, { fields: [characters.userId], references: [users.id] }),
  threads: many(threads),
  posts: many(posts),
  pets: many(pets),
}));

export const boardsRelations = relations(boards, ({ many }) => ({
  threads: many(threads),
}));

export const threadsRelations = relations(threads, ({ one, many }) => ({
  board: one(boards, { fields: [threads.boardId], references: [boards.id] }),
  character: one(characters, { fields: [threads.characterId], references: [characters.id] }),
  user: one(users, { fields: [threads.userId], references: [users.id] }),
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  thread: one(threads, { fields: [posts.threadId], references: [threads.id] }),
  character: one(characters, { fields: [posts.characterId], references: [characters.id] }),
  user: one(users, { fields: [posts.userId], references: [users.id] }),
}));

export const petsRelations = relations(pets, ({ one }) => ({
  character: one(characters, { fields: [pets.characterId], references: [characters.id] }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  character: one(characters, { fields: [chatMessages.characterId], references: [characters.id] }),
  user: one(users, { fields: [chatMessages.userId], references: [users.id] }),
}));
