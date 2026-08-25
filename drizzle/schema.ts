import { index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/** Each browser receives an opaque owner key, which allows no-login assessment history without exposing records to other browsers. */
export const assessmentSessions = mysqlTable("assessmentSessions", {
  id: varchar("id", { length: 24 }).primaryKey(),
  userId: int("userId").references(() => users.id, { onDelete: "cascade" }),
  ownerKey: varchar("ownerKey", { length: 128 }).notNull().default(""),
  title: varchar("title", { length: 255 }).notNull(),
  studentName: varchar("studentName", { length: 255 }),
  stage: mysqlEnum("stage", ["draft", "extracting", "mapped", "reviewed"]).default("draft").notNull(),
  questionPaperName: varchar("questionPaperName", { length: 512 }),
  questionPaperKey: varchar("questionPaperKey", { length: 1024 }),
  questionPaperUrl: varchar("questionPaperUrl", { length: 2048 }),
  answerSheetName: varchar("answerSheetName", { length: 512 }),
  answerSheetKey: varchar("answerSheetKey", { length: 1024 }),
  answerSheetUrl: varchar("answerSheetUrl", { length: 2048 }),
  activeQuestionId: varchar("activeQuestionId", { length: 24 }),
  activeAnswerPage: int("activeAnswerPage").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("assessmentSessions_owner_updated_idx").on(table.ownerKey, table.updatedAt)]);

export const assessmentQuestions = mysqlTable("assessmentQuestions", {
  id: varchar("id", { length: 24 }).primaryKey(),
  assessmentId: varchar("assessmentId", { length: 24 }).notNull().references(() => assessmentSessions.id, { onDelete: "cascade" }),
  questionNumber: varchar("questionNumber", { length: 64 }).notNull(),
  sortOrder: int("sortOrder").notNull(),
  text: text("text").notNull(),
  marks: int("marks"),
  mappingStatus: mysqlEnum("mappingStatus", ["mapped", "needs_review", "unanswered", "unmatched"]).default("needs_review").notNull(),
  extractedAnswer: text("extractedAnswer"),
  confidence: int("confidence").default(0).notNull(),
  suggestedScore: int("suggestedScore"),
  teacherScore: int("teacherScore"),
  teacherFeedback: text("teacherFeedback"),
  reviewDecision: mysqlEnum("reviewDecision", ["pending", "approved", "adjusted"]).default("pending").notNull(),
  answerPage: int("answerPage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("assessmentQuestions_assessment_sort_idx").on(table.assessmentId, table.sortOrder)]);

export const answerRegions = mysqlTable("answerRegions", {
  id: varchar("id", { length: 24 }).primaryKey(),
  assessmentId: varchar("assessmentId", { length: 24 }).notNull().references(() => assessmentSessions.id, { onDelete: "cascade" }),
  questionId: varchar("questionId", { length: 24 }).references(() => assessmentQuestions.id, { onDelete: "cascade" }),
  pageNumber: int("pageNumber").notNull(),
  topPercent: int("topPercent").notNull(),
  leftPercent: int("leftPercent").notNull(),
  widthPercent: int("widthPercent").notNull(),
  heightPercent: int("heightPercent").notNull(),
  label: varchar("label", { length: 255 }),
  confidence: int("confidence").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("answerRegions_assessment_question_idx").on(table.assessmentId, table.questionId)]);

export const assessmentReviewEvents = mysqlTable("assessmentReviewEvents", {
  id: varchar("id", { length: 24 }).primaryKey(),
  assessmentId: varchar("assessmentId", { length: 24 }).notNull().references(() => assessmentSessions.id, { onDelete: "cascade" }),
  questionId: varchar("questionId", { length: 24 }).notNull().references(() => assessmentQuestions.id, { onDelete: "cascade" }),
  userId: int("userId").references(() => users.id, { onDelete: "cascade" }),
  decision: mysqlEnum("decision", ["approved", "adjusted"]).notNull(),
  score: int("score"),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("assessmentReviewEvents_question_created_idx").on(table.questionId, table.createdAt)]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type AssessmentSession = typeof assessmentSessions.$inferSelect;
export type AssessmentQuestion = typeof assessmentQuestions.$inferSelect;
export type AnswerRegion = typeof answerRegions.$inferSelect;
export type AssessmentReviewEvent = typeof assessmentReviewEvents.$inferSelect;
