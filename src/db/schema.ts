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
export const boardKindEnum = pgEnum("board_kind", ["category", "board", "class", "article"]);
export const submissionStatusEnum = pgEnum("submission_status", [
  "open", // posted, still needs more graders (fewer than REQUIRED_GRADERS have graded)
  "graded", // REQUIRED_GRADERS have graded; consensus computed, payout issued
]);
export const gradeTierEnum = pgEnum("grade_tier", [
  "perfect",
  "excellent",
  "good",
  "needs_improvement",
  "failing",
]);
export const relationStatusEnum = pgEnum("relation_status", ["pending", "accepted"]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "thread_reply",
  "relation_request",
  "homework_graded",
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
export const hallEnum = pgEnum("hall", ["undercroft", "veil", "rampart", "eaves"]);
export const reputationReasonEnum = pgEnum("reputation_reason", [
  "homework_submission",
  "grading",
  "thread_created",
  "thread_reply",
  "admin_adjustment",
]);

/** Level required before a character is allowed to claim/grade homework. */
export const GRADING_LEVEL_REQUIREMENT = 3;

/** Level required before a character can use /me in chat. */
export const ME_COMMAND_LEVEL_REQUIREMENT = 10;

/** How many distinct graders must grade a submission before it's final. */
export const REQUIRED_GRADERS = 4;

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
    // Set once at creation (18-25), then locked — same pattern as major.
    // Admin can override.
    age: integer("age").notNull().default(18),
    // Year is normally computed from lessons taken (see src/lib/year.ts). If an
    // admin sets this, it overrides the computed value entirely. Null = auto.
    yearOverride: varchar("year_override", { length: 20 }),
    bio: text("bio"),
    // Freely editable, no locking (unlike major/age) — just profile info.
    gender: text("gender"), // "Male" | "Non-binary" | "Female" — validated in lib/character-options.ts
    socialStatus: text("social_status"), // "Spy Born" | "Family Secret" | "New Blood" — see same file
    // Set at creation (chosen directly or via the sorting quiz), locked
    // afterward — admin can still change it from /admin/users.
    hall: hallEnum("hall"),
    personality: text("personality"),
    appearance: text("appearance"),
    avatarUrl: text("avatar_url"),
    // Updated by a periodic heartbeat while this character is the active one
    // in an open tab — drives "who's online" and who can be pinged in chat.
    lastActiveAt: timestamp("last_active_at"),
    isArchived: boolean("is_archived").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    slugIdx: uniqueIndex("characters_slug_idx").on(table.slug),
  })
);

/**
 * A character can hold multiple jobs at once (e.g. Spymaster AND Instructor),
 * and shows up on the Job List under every job they hold. One row per
 * (character, job) pair.
 */
export const characterJobs = pgTable(
  "character_jobs",
  {
    id: serial("id").primaryKey(),
    characterId: integer("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    job: characterJobEnum("job").notNull(),
    // Optional custom title shown on the Job List instead of the generic job
    // label — e.g. two "Head Staff" characters leading different teams can
    // each show "Head of Enforcement" / "Head of the Library" instead.
    jobTitle: varchar("job_title", { length: 100 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    uniquePair: uniqueIndex("character_jobs_unique_idx").on(table.characterId, table.job),
  })
);

/**
 * The welcome message shown to a newly-sorted character, "from" that hall's
 * Resident Advisor. One row per hall. Editable by that hall's own Resident
 * Advisor (field_agent job + matching hall), or admin.
 */
export const hallWelcomeMessages = pgTable("hall_welcome_messages", {
  hall: hallEnum("hall").primaryKey(),
  title: varchar("title", { length: 120 }).notNull().default("Welcome!"),
  content: text("content").notNull().default(""),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * A custom status/title an admin puts on a character — shown on their
 * profile and hover card. Free text, not tied to jobs. A character can hold
 * several at once.
 */
export const characterStatuses = pgTable("character_statuses", {
  id: serial("id").primaryKey(),
  characterId: integer("character_id")
    .notNull()
    .references(() => characters.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * Hall sorting quiz — admin defines up to 12 questions, each with several
 * answers that each point toward one hall. Whichever hall gets the most
 * matching answers is where the character gets sorted.
 */
export const sortingQuestions = pgTable("sorting_questions", {
  id: serial("id").primaryKey(),
  questionText: text("question_text").notNull(),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sortingAnswers = pgTable("sorting_answers", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id")
    .notNull()
    .references(() => sortingQuestions.id, { onDelete: "cascade" }),
  answerText: text("answer_text").notNull(),
  hall: hallEnum("hall").notNull(),
  position: integer("position").notNull().default(0),
});

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
    // For "article" boards only: an extra job (beyond management) that's
    // auto-permitted to post here — e.g. "writer" on Armistead Weekly, so
    // writers don't each need an individual admin grant.
    extraArticleJob: characterJobEnum("extra_article_job"),
    // If set, this board (view AND post) is exclusive to that hall's own
    // members — not even general management can see it, only admin.
    restrictedToHall: hallEnum("restricted_to_hall"),
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
  // Optional scene-setting details the thread starter can fill in.
  location: varchar("location", { length: 200 }),
  timeSetting: varchar("time_setting", { length: 100 }),
  surroundings: text("surroundings"),
  // Out-of-character notes for the topic, shown separately from the IC content.
  ooc: text("ooc"),
  // Content rating 1-5 — see RATING_META in lib/thread-rating.ts for what each level means.
  rating: integer("rating"),
  isLocked: boolean("is_locked").notNull().default(false),
  isPinned: boolean("is_pinned").notNull().default(false),
  // Article boards only: if set and in the future, the article is hidden
  // from public view until this time — management/authors can still see it.
  scheduledFor: timestamp("scheduled_for"),
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

/**
 * Emoji reactions on a forum post, attributed to the CHARACTER that reacted
 * (not the account) — so if you switch characters, you react as that persona.
 * One row per (post, character, emoji) — a character can stack multiple
 * different emoji on the same post, but not the same emoji twice.
 */
export const postReactions = pgTable(
  "post_reactions",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    characterId: integer("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    emoji: varchar("emoji", { length: 16 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    uniqueReaction: uniqueIndex("post_reactions_unique_idx").on(
      table.postId,
      table.characterId,
      table.emoji
    ),
  })
);

/** Lightweight comments on a forum post (not a full reply post in the thread). */
export const postComments = pgTable("post_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  characterId: integer("character_id")
    .notNull()
    .references(() => characters.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: varchar("content", { length: 1000 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
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
  // System-generated announcements (enrollment, etc) — rendered with
  // distinct styling so they stand out from regular chat.
  isAnnouncement: boolean("is_announcement").notNull().default(false),
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

/**
 * Explicit posting permission on an "article" board (Notice Board, Community
 * Board) for a character who isn't management by job — e.g. a writer given
 * posting rights without holding a management job. Management-job holders
 * and admins can always post on article boards regardless of this table.
 */
export const boardPostPermissions = pgTable(
  "board_post_permissions",
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
    uniquePair: uniqueIndex("board_post_permissions_character_board_idx").on(
      table.characterId,
      table.boardId
    ),
  })
);

/**
 * A section of the Rules & Guidelines guidebook (Site Rules, About Armistead,
 * Member Groups, etc). Admin can add, edit, delete, and reorder these — the
 * whole page is built from this table, nothing hardcoded.
 */
export const guideSections = pgTable(
  "guide_sections",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 120 }).notNull(),
    slug: varchar("slug", { length: 140 }).notNull(),
    content: text("content").notNull(),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    slugIdx: uniqueIndex("guide_sections_slug_idx").on(table.slug),
  })
);

/**
 * The homepage announcement/welcome widget. Always a single row (id fixed
 * at 1) — admin edits it in place rather than managing a list.
 */
export const homeAnnouncement = pgTable("home_announcement", {
  id: integer("id").primaryKey().default(1),
  title: varchar("title", { length: 120 }).notNull().default("Welcome!"),
  content: text("content").notNull().default(""),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/** "Spotlight of the week" — admin picks up to two characters to feature on every homepage. */
export const spotlightEntries = pgTable("spotlight_entries", {
  id: serial("id").primaryKey(),
  characterId: integer("character_id")
    .notNull()
    .references(() => characters.id, { onDelete: "cascade" }),
  blurb: text("blurb").notNull(),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * A relation between two characters (married, sibling, enemy, etc). Stored
 * as a directed edge: relationType is written from fromCharacter's point of
 * view. Directional types (parent_of/child_of, godparent_of/godchild_of)
 * display as their inverse on the toCharacter's side — see
 * lib/relations.ts for the type list and inverse lookup. Symmetric types
 * (married_to, sibling_to, enemy_of, etc) display the same on both sides.
 */
export const characterRelations = pgTable(
  "character_relations",
  {
    id: serial("id").primaryKey(),
    fromCharacterId: integer("from_character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    toCharacterId: integer("to_character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    relationType: text("relation_type").notNull(),
    status: relationStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    respondedAt: timestamp("responded_at"),
  },
  (table) => ({
    uniqueTriple: uniqueIndex("character_relations_unique_idx").on(
      table.fromCharacterId,
      table.toCharacterId,
      table.relationType
    ),
  })
);

/**
 * A notification for a character: someone replied to a topic they're in,
 * sent them a relation request, or their homework was graded. Shown via the
 * bell icon in the nav, next to the account menu.
 */
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  characterId: integer("character_id")
    .notNull()
    .references(() => characters.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  message: text("message").notNull(),
  link: text("link").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  boardId: integer("board_id")
    .notNull()
    .references(() => boards.id, { onDelete: "cascade" }), // the "class" board this lesson belongs to
  title: varchar("title", { length: 200 }).notNull(),
  prompt: text("prompt").notNull(), // the assignment text
  // Optional — specific requirements/criteria homework must meet, shown as
  // its own section separate from the narrative prompt above.
  requirements: text("requirements"),
  createdByUserId: integer("created_by_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  position: integer("position").notNull().default(0),
  // Flat reward the instructor sets — actual payout is this times a
  // multiplier based on the final tier (see TIER_MULTIPLIERS in lib/grading.ts).
  reward: integer("reward").notNull().default(20),
  graderFee: integer("grader_fee").notNull().default(5), // what each grader earns per grade
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** A student must enroll in a class before its lessons open up to them. */
export const classEnrollments = pgTable(
  "class_enrollments",
  {
    id: serial("id").primaryKey(),
    characterId: integer("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    boardId: integer("board_id")
      .notNull()
      .references(() => boards.id, { onDelete: "cascade" }),
    enrolledAt: timestamp("enrolled_at").notNull().defaultNow(),
  },
  (table) => ({
    uniquePair: uniqueIndex("class_enrollments_unique_idx").on(table.characterId, table.boardId),
  })
);

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
  // Set once REQUIRED_GRADERS have graded — the consensus result.
  finalTier: gradeTierEnum("final_tier"),
  grade: integer("grade"), // 0-100, derived from finalTier
  payout: integer("payout"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  gradedAt: timestamp("graded_at"),
});

/** One grader's tier + feedback on a submission. REQUIRED_GRADERS of these = a final grade. */
export const submissionGrades = pgTable(
  "submission_grades",
  {
    id: serial("id").primaryKey(),
    submissionId: integer("submission_id")
      .notNull()
      .references(() => submissions.id, { onDelete: "cascade" }),
    graderCharacterId: integer("grader_character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    tier: gradeTierEnum("tier").notNull(),
    feedback: text("feedback"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    uniqueGraderPerSubmission: uniqueIndex("submission_grades_unique_idx").on(
      table.submissionId,
      table.graderCharacterId
    ),
  })
);

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
  // set null (not cascade, not the default no-action): a ledger entry is a
  // permanent record of currency someone actually received — deleting the
  // lesson/submission it came from must not delete or block-delete this row,
  // it should just lose the "related to what" link.
  relatedSubmissionId: integer("related_submission_id").references(() => submissions.id, {
    onDelete: "set null",
  }),
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
  // Same reasoning as currencyLedger above — XP earned is permanent even if
  // the lesson/submission/post it came from is later deleted.
  relatedSubmissionId: integer("related_submission_id").references(() => submissions.id, {
    onDelete: "set null",
  }),
  relatedPostId: integer("related_post_id").references(() => posts.id, { onDelete: "set null" }),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * Reputation — a separate point system from XP/level. Earned from grading,
 * posting/replying in topics, and submitting homework. Feeds both a
 * character's own reputation and their hall's total on /reputation.
 */
export const reputationLedger = pgTable("reputation_ledger", {
  id: serial("id").primaryKey(),
  characterId: integer("character_id")
    .notNull()
    .references(() => characters.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  reason: reputationReasonEnum("reason").notNull(),
  relatedSubmissionId: integer("related_submission_id").references(() => submissions.id, {
    onDelete: "set null",
  }),
  relatedPostId: integer("related_post_id").references(() => posts.id, { onDelete: "set null" }),
  note: text("note"),
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

/**
 * Private messaging ("Messages") — separate from the in-character
 * "Text Messages" board. A thread can have several participants; only
 * whoever created it can add or remove people.
 */
export const messageThreads = pgTable("message_threads", {
  id: serial("id").primaryKey(),
  subject: varchar("subject", { length: 200 }).notNull(),
  creatorCharacterId: integer("creator_character_id")
    .notNull()
    .references(() => characters.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastMessageAt: timestamp("last_message_at").notNull().defaultNow(),
});

/** One row per participant per thread — read/delete state is per-person, not global. */
export const messageThreadParticipants = pgTable(
  "message_thread_participants",
  {
    id: serial("id").primaryKey(),
    threadId: integer("thread_id")
      .notNull()
      .references(() => messageThreads.id, { onDelete: "cascade" }),
    characterId: integer("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    isRead: boolean("is_read").notNull().default(true),
    isDeleted: boolean("is_deleted").notNull().default(false),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
  },
  (table) => ({
    uniquePair: uniqueIndex("message_participants_unique_idx").on(table.threadId, table.characterId),
  })
);

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id")
    .notNull()
    .references(() => messageThreads.id, { onDelete: "cascade" }),
  characterId: integer("character_id")
    .notNull()
    .references(() => characters.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
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

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  character: one(characters, { fields: [chatMessages.characterId], references: [characters.id] }),
  user: one(users, { fields: [chatMessages.userId], references: [users.id] }),
}));
