import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================
// KEYWORDS HELPERS
// ============================================

export async function getUserKeywords(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { keywords } = await import("../drizzle/schema");
  return await db.select().from(keywords).where(eq(keywords.userId, userId));
}

export async function getKeywordById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const { keywords } = await import("../drizzle/schema");
  const { and } = await import("drizzle-orm");
  const result = await db.select().from(keywords).where(
    and(eq(keywords.id, id), eq(keywords.userId, userId))
  ).limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function createKeyword(data: {
  userId: number;
  keyword: string;
  url: string;
  location?: string;
  targetPosition?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { keywords } = await import("../drizzle/schema");
  type InsertKeyword = typeof keywords.$inferInsert;
  const insertData: InsertKeyword = {
    userId: data.userId,
    keyword: data.keyword,
    url: data.url,
    location: data.location || "Brazil",
    targetPosition: data.targetPosition || 1,
    isActive: 1,
  };
  
  const result = await db.insert(keywords).values(insertData);
  return Number((result as any).insertId);
}

export async function updateKeyword(id: number, userId: number, data: {
  keyword?: string;
  url?: string;
  location?: string;
  targetPosition?: number;
  isActive?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { keywords } = await import("../drizzle/schema");
  const { and } = await import("drizzle-orm");
  
  await db.update(keywords).set(data).where(
    and(eq(keywords.id, id), eq(keywords.userId, userId))
  );
}

export async function deleteKeyword(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { keywords } = await import("../drizzle/schema");
  const { and } = await import("drizzle-orm");
  
  await db.delete(keywords).where(
    and(eq(keywords.id, id), eq(keywords.userId, userId))
  );
}

// ============================================
// RANKINGS HELPERS
// ============================================

export async function getRankingsByKeyword(keywordId: number, userId: number, limit = 12) {
  const db = await getDb();
  if (!db) return [];
  
  const { rankings } = await import("../drizzle/schema");
  const { and, desc } = await import("drizzle-orm");
  
  return await db.select().from(rankings)
    .where(and(eq(rankings.keywordId, keywordId), eq(rankings.userId, userId)))
    .orderBy(desc(rankings.date))
    .limit(limit);
}

export async function getLatestRanking(keywordId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const { rankings } = await import("../drizzle/schema");
  const { and, desc } = await import("drizzle-orm");
  
  const result = await db.select().from(rankings)
    .where(and(eq(rankings.keywordId, keywordId), eq(rankings.userId, userId)))
    .orderBy(desc(rankings.date))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function createRanking(data: {
  keywordId: number;
  userId: number;
  position: number | null;
  impressions?: number;
  clicks?: number;
  ctr?: string;
  date: string;
  week: number;
  year: number;
  change?: number;
  changeType?: "up" | "down" | "stable";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { rankings } = await import("../drizzle/schema");
  type InsertRanking = typeof rankings.$inferInsert;
  const insertData: InsertRanking = {
    keywordId: data.keywordId,
    userId: data.userId,
    position: data.position,
    impressions: data.impressions || 0,
    clicks: data.clicks || 0,
    ctr: data.ctr || "0",
    date: data.date,
    week: data.week,
    year: data.year,
    change: data.change || 0,
    changeType: data.changeType || "stable",
  };
  
  const result = await db.insert(rankings).values(insertData);
  return Number((result as any).insertId);
}

export async function getRankingsSummary(userId: number) {
  const db = await getDb();
  if (!db) return { totalKeywords: 0, avgPosition: 0, improved: 0, declined: 0, stable: 0 };
  
  const { keywords, rankings } = await import("../drizzle/schema");
  const { and, eq, sql } = await import("drizzle-orm");
  
  // ✅ UMA ÚNICA QUERY com subquery - elimina N+1
  const result = await db
    .select({
      keywordId: keywords.id,
      latestPosition: sql<number>`(
        SELECT r.position 
        FROM ${rankings} r 
        WHERE r.keywordId = ${keywords.id} 
          AND r.userId = ${userId}
        ORDER BY r.date DESC 
        LIMIT 1
      )`,
      latestChangeType: sql<string>`(
        SELECT r.changeType 
        FROM ${rankings} r 
        WHERE r.keywordId = ${keywords.id} 
          AND r.userId = ${userId}
        ORDER BY r.date DESC 
        LIMIT 1
      )`,
    })
    .from(keywords)
    .where(and(eq(keywords.userId, userId), eq(keywords.isActive, 1)));
  
  // Processar resultados
  let totalPosition = 0;
  let countWithPosition = 0;
  let improved = 0;
  let declined = 0;
  let stable = 0;
  
  for (const row of result) {
    if (row.latestPosition) {
      totalPosition += row.latestPosition;
      countWithPosition++;
    }
    
    if (row.latestChangeType === 'up') improved++;
    else if (row.latestChangeType === 'down') declined++;
    else stable++;
  }
  
  return {
    totalKeywords: result.length,
    avgPosition: countWithPosition > 0 
      ? Math.round(totalPosition / countWithPosition * 10) / 10 
      : 0,
    improved,
    declined,
    stable,
  };
}

// ============================================
// GSC TOKENS HELPERS
// ============================================

export async function getGscToken(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const { gscTokens } = await import("../drizzle/schema");
  const result = await db.select().from(gscTokens).where(eq(gscTokens.userId, userId)).limit(1);
  
  if (result.length === 0) return undefined;
  
  const token = result[0]!;
  
  // Tentar descriptografar - se falhar, retornar como está (backward compatibility)
  try {
    const { decrypt } = await import('./_core/encryption');
    return {
      ...token,
      accessToken: decrypt(token.accessToken),
      refreshToken: decrypt(token.refreshToken),
    };
  } catch (error) {
    // Se ENCRYPTION_KEY não estiver configurada ou tokens não estiverem criptografados
    console.warn('[Database] Tokens não criptografados ou erro ao descriptografar');
    return token;
  }
}

export async function upsertGscToken(data: {
  userId: number;
  siteUrl: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { gscTokens } = await import("../drizzle/schema");
  type InsertGscToken = typeof gscTokens.$inferInsert;
  
  // Tentar criptografar - se falhar, salvar sem criptografia (backward compatibility)
  let encryptedAccessToken = data.accessToken;
  let encryptedRefreshToken = data.refreshToken;
  
  try {
    const { encrypt } = await import('./_core/encryption');
    encryptedAccessToken = encrypt(data.accessToken);
    encryptedRefreshToken = encrypt(data.refreshToken);
  } catch (error) {
    console.warn('[Database] ENCRYPTION_KEY não configurada - salvando tokens SEM criptografia!');
  }
  
  const insertData: InsertGscToken = {
    userId: data.userId,
    siteUrl: data.siteUrl,
    accessToken: encryptedAccessToken,
    refreshToken: encryptedRefreshToken,
    expiresAt: data.expiresAt,
  };
  
  await db.insert(gscTokens).values(insertData).onDuplicateKeyUpdate({
    set: {
      siteUrl: data.siteUrl,
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      expiresAt: data.expiresAt,
    },
  });
}

export async function deleteGscToken(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { gscTokens } = await import("../drizzle/schema");
  await db.delete(gscTokens).where(eq(gscTokens.userId, userId));
}

// ============================================
// ALERTS HELPERS
// ============================================

export async function getUserAlerts(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  
  const { alerts } = await import("../drizzle/schema");
  const { desc } = await import("drizzle-orm");
  
  return await db.select().from(alerts)
    .where(eq(alerts.userId, userId))
    .orderBy(desc(alerts.createdAt))
    .limit(limit);
}

export async function createAlert(data: {
  userId: number;
  keywordId: number;
  type: string;
  message: string;
  oldPosition?: number;
  newPosition?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { alerts } = await import("../drizzle/schema");
  type InsertAlert = typeof alerts.$inferInsert;
  const insertData: InsertAlert = {
    userId: data.userId,
    keywordId: data.keywordId,
    type: data.type,
    message: data.message,
    oldPosition: data.oldPosition,
    newPosition: data.newPosition,
    isRead: 0,
    sentToSlack: 0,
    sentToEmail: 0,
  };
  
  const result = await db.insert(alerts).values(insertData);
  return Number((result as any).insertId);
}

export async function markAlertAsRead(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { alerts } = await import("../drizzle/schema");
  const { and } = await import("drizzle-orm");
  
  await db.update(alerts).set({ isRead: 1 }).where(
    and(eq(alerts.id, id), eq(alerts.userId, userId))
  );
}
