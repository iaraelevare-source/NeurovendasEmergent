import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Keywords table - stores keywords to monitor per user
 */
export const keywords = mysqlTable("keywords", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  keyword: varchar("keyword", { length: 255 }).notNull(),
  url: text("url").notNull(),
  location: varchar("location", { length: 100 }).default("Brazil"),
  targetPosition: int("targetPosition").default(1),
  isActive: int("isActive").default(1).notNull(), // 1 = active, 0 = inactive
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Keyword = typeof keywords.$inferSelect;
export type InsertKeyword = typeof keywords.$inferInsert;

/**
 * Rankings table - stores historical ranking data
 */
export const rankings = mysqlTable("rankings", {
  id: int("id").autoincrement().primaryKey(),
  keywordId: int("keywordId").notNull(),
  userId: int("userId").notNull(),
  position: int("position"),
  impressions: int("impressions").default(0),
  clicks: int("clicks").default(0),
  ctr: varchar("ctr", { length: 10 }).default("0"), // stored as string to preserve precision
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD format
  week: int("week").notNull(),
  year: int("year").notNull(),
  change: int("change").default(0), // positive = improved, negative = declined
  changeType: mysqlEnum("changeType", ["up", "down", "stable"]).default("stable"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Ranking = typeof rankings.$inferSelect;
export type InsertRanking = typeof rankings.$inferInsert;

/**
 * GSC Tokens table - stores encrypted Google Search Console OAuth tokens
 */
export const gscTokens = mysqlTable("gscTokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  siteUrl: text("siteUrl").notNull(),
  accessToken: text("accessToken").notNull(), // encrypted
  refreshToken: text("refreshToken").notNull(), // encrypted
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GscToken = typeof gscTokens.$inferSelect;
export type InsertGscToken = typeof gscTokens.$inferInsert;

/**
 * Alerts table - stores generated alerts for significant changes
 */
export const alerts = mysqlTable("alerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  keywordId: int("keywordId").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // significant_change, target_reached, etc
  message: text("message").notNull(),
  oldPosition: int("oldPosition"),
  newPosition: int("newPosition"),
  isRead: int("isRead").default(0).notNull(), // 0 = unread, 1 = read
  sentToSlack: int("sentToSlack").default(0).notNull(),
  sentToEmail: int("sentToEmail").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;