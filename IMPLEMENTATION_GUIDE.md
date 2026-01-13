# 🛠️ GUIA DE IMPLEMENTAÇÃO - Correções Prioritárias

Este documento contém **código pronto para uso** para corrigir os problemas críticos identificados na análise técnica.

---

## 🔴 PROBLEMA 1: Tokens OAuth Não Criptografados

### Solução: Criar biblioteca de criptografia

**Arquivo: `server/_core/encryption.ts`**

```typescript
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

// Gera chave a partir da senha (env var)
function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret || secret.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters');
  }
  // Usa salt fixo para mesma chave sempre (importante para decrypt)
  const salt = process.env.ENCRYPTION_SALT || 'neurovend-salt-2026';
  return scryptSync(secret, salt, KEY_LENGTH);
}

export function encrypt(text: string): string {
  try {
    const key = getKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Formato: iv:tag:encrypted
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('[Encryption] Failed to encrypt:', error);
    throw new Error('Encryption failed');
  }
}

export function decrypt(encryptedData: string): string {
  try {
    const key = getKey();
    const parts = encryptedData.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0]!, 'hex');
    const tag = Buffer.from(parts[1]!, 'hex');
    const encrypted = parts[2]!;
    
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('[Encryption] Failed to decrypt:', error);
    throw new Error('Decryption failed');
  }
}
```

### Atualizar funções de GSC Token

**Arquivo: `server/db.ts` - Modificar `upsertGscToken` e `getGscToken`**

```typescript
import { encrypt, decrypt } from './_core/encryption';

// SUBSTITUIR função existente (linha ~300)
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
  
  // CRIPTOGRAFAR antes de salvar
  const insertData: InsertGscToken = {
    userId: data.userId,
    siteUrl: data.siteUrl,
    accessToken: encrypt(data.accessToken), // ✅ CRIPTOGRAFADO
    refreshToken: encrypt(data.refreshToken), // ✅ CRIPTOGRAFADO
    expiresAt: data.expiresAt,
  };
  
  await db.insert(gscTokens).values(insertData).onDuplicateKeyUpdate({
    set: {
      siteUrl: data.siteUrl,
      accessToken: encrypt(data.accessToken), // ✅ CRIPTOGRAFADO
      refreshToken: encrypt(data.refreshToken), // ✅ CRIPTOGRAFADO
      expiresAt: data.expiresAt,
    },
  });
}

// SUBSTITUIR função existente (linha ~290)
export async function getGscToken(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const { gscTokens } = await import("../drizzle/schema");
  const result = await db.select().from(gscTokens).where(eq(gscTokens.userId, userId)).limit(1);
  
  if (result.length === 0) return undefined;
  
  const token = result[0]!;
  
  // DESCRIPTOGRAFAR antes de retornar
  return {
    ...token,
    accessToken: decrypt(token.accessToken), // ✅ DESCRIPTOGRAFADO
    refreshToken: decrypt(token.refreshToken), // ✅ DESCRIPTOGRAFADO
  };
}
```

### Adicionar variáveis de ambiente

**Arquivo: `.env` (criar se não existir)**

```bash
# Gerar com: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=sua_chave_secreta_de_64_caracteres_aqui_muito_importante
ENCRYPTION_SALT=neurovend-salt-2026-production
```

---

## 🔴 PROBLEMA 2: Rate Limiting

### Solução: Implementar rate limiting por IP e usuário

**Instalar dependência:**
```bash
pnpm add express-rate-limit
```

**Arquivo: `server/_core/rateLimiter.ts`**

```typescript
import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';

// Rate limiter global por IP
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Muitas requisições deste IP. Tente novamente em 15 minutos.',
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'rate_limit_exceeded',
      message: 'Muitas requisições. Tente novamente mais tarde.',
      retryAfter: req.rateLimit.resetTime,
    });
  },
});

// Rate limiter mais estrito para OAuth
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // 5 tentativas
  skipSuccessfulRequests: true,
  message: 'Muitas tentativas de login. Tente novamente em 1 hora.',
});

// Rate limiter para APIs externas (GSC, OpenAI)
export const externalApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 requests/minuto
  skipFailedRequests: true,
  message: 'Limite de chamadas à API externa excedido.',
});
```

**Atualizar `server/_core/index.ts`:**

```typescript
import { globalLimiter, authLimiter } from './rateLimiter';

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Rate limiting ANTES de qualquer rota
  app.use('/api/', globalLimiter);
  
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // OAuth com rate limiting específico
  app.use('/api/oauth/', authLimiter);
  registerOAuthRoutes(app);
  
  // ... resto do código
}
```

---

## 🔴 PROBLEMA 3: Validação de Ownership

### Solução: Middleware de verificação

**Arquivo: `server/_core/ownership.ts`**

```typescript
import { TRPCError } from '@trpc/server';
import type { User } from '../../drizzle/schema';

export async function verifyKeywordOwnership(
  keywordId: number,
  userId: number
): Promise<void> {
  const { getKeywordById } = await import('../db');
  const keyword = await getKeywordById(keywordId, userId);
  
  if (!keyword) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Keyword não encontrada ou você não tem permissão para acessá-la',
    });
  }
}

export async function verifyAlertOwnership(
  alertId: number,
  userId: number
): Promise<void> {
  const db = await import('../db').then(m => m.getDb());
  if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
  
  const { alerts } = await import('../../drizzle/schema');
  const { and, eq } = await import('drizzle-orm');
  
  const result = await db.select()
    .from(alerts)
    .where(and(eq(alerts.id, alertId), eq(alerts.userId, userId)))
    .limit(1);
  
  if (result.length === 0) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Você não tem permissão para acessar este alerta',
    });
  }
}
```

**Atualizar `server/routers.ts`:**

```typescript
import { verifyKeywordOwnership, verifyAlertOwnership } from './_core/ownership';

// Exemplo: atualizar endpoint de delete
delete: protectedProcedure
  .input(z.object({ id: z.number() }))
  .mutation(async ({ ctx, input }) => {
    // ✅ VERIFICAR OWNERSHIP ANTES
    await verifyKeywordOwnership(input.id, ctx.user.id);
    
    const { deleteKeyword } = await import("./db");
    await deleteKeyword(input.id, ctx.user.id);
    return { success: true };
  }),

// Aplicar em TODOS os endpoints que manipulam recursos
```

---

## 🔴 PROBLEMA 4: N+1 Queries

### Solução: Refatorar getRankingsSummary

**Arquivo: `server/db.ts` - SUBSTITUIR função (linha ~240)**

```typescript
export async function getRankingsSummary(userId: number) {
  const db = await getDb();
  if (!db) return { totalKeywords: 0, avgPosition: 0, improved: 0, declined: 0, stable: 0 };
  
  const { keywords, rankings } = await import("../drizzle/schema");
  const { and, eq, sql } = await import("drizzle-orm");
  
  // ✅ UMA ÚNICA QUERY com subquery
  const result = await db
    .select({
      keywordId: keywords.id,
      latestPosition: sql<number>`(
        SELECT r.position 
        FROM rankings r 
        WHERE r.keywordId = ${keywords.id} 
          AND r.userId = ${userId}
        ORDER BY r.date DESC 
        LIMIT 1
      )`,
      latestChangeType: sql<string>`(
        SELECT r.changeType 
        FROM rankings r 
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
```

---

## 🔴 PROBLEMA 5: Índices no Banco

### Solução: Adicionar índices ao schema

**Arquivo: `drizzle/schema.ts` - ADICIONAR após definições das tabelas**

```typescript
import { index } from "drizzle-orm/mysql-core";

// MODIFICAR tabela keywords (linha ~31)
export const keywords = mysqlTable("keywords", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  keyword: varchar("keyword", { length: 255 }).notNull(),
  url: text("url").notNull(),
  location: varchar("location", { length: 100 }).default("Brazil"),
  targetPosition: int("targetPosition").default(1),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  // ✅ ÍNDICES
  userIdIdx: index("idx_keywords_user").on(table.userId),
  userActiveIdx: index("idx_keywords_user_active").on(table.userId, table.isActive),
}));

// MODIFICAR tabela rankings (linha ~49)
export const rankings = mysqlTable("rankings", {
  id: int("id").autoincrement().primaryKey(),
  keywordId: int("keywordId").notNull(),
  userId: int("userId").notNull(),
  position: int("position"),
  impressions: int("impressions").default(0),
  clicks: int("clicks").default(0),
  ctr: varchar("ctr", { length: 10 }).default("0"),
  date: varchar("date", { length: 10 }).notNull(),
  week: int("week").notNull(),
  year: int("year").notNull(),
  change: int("change").default(0),
  changeType: mysqlEnum("changeType", ["up", "down", "stable"]).default("stable"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  // ✅ ÍNDICES COMPOSTOS (mais eficientes)
  keywordDateIdx: index("idx_rankings_keyword_date").on(table.keywordId, table.date),
  userKeywordIdx: index("idx_rankings_user_keyword").on(table.userId, table.keywordId),
  dateIdx: index("idx_rankings_date").on(table.date),
}));

// MODIFICAR tabela alerts (linha ~88)
export const alerts = mysqlTable("alerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  keywordId: int("keywordId").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  message: text("message").notNull(),
  oldPosition: int("oldPosition"),
  newPosition: int("newPosition"),
  isRead: int("isRead").default(0).notNull(),
  sentToSlack: int("sentToSlack").default(0).notNull(),
  sentToEmail: int("sentToEmail").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  // ✅ ÍNDICES
  userCreatedIdx: index("idx_alerts_user_created").on(table.userId, table.createdAt),
  userReadIdx: index("idx_alerts_user_read").on(table.userId, table.isRead),
}));
```

**Gerar e aplicar migration:**

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

---

## 🟠 PROBLEMA 6: Validação de ENV

### Solução: Validar variáveis na inicialização

**Arquivo: `server/_core/env.ts` - SUBSTITUIR TUDO**

```typescript
import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url().optional(),
  
  // OAuth
  MANUS_OAUTH_CLIENT_ID: z.string().min(1).optional(),
  MANUS_OAUTH_CLIENT_SECRET: z.string().min(1).optional(),
  MANUS_OAUTH_CALLBACK_URL: z.string().url().optional(),
  
  // Google Search Console
  GSC_CLIENT_ID: z.string().optional(),
  GSC_CLIENT_SECRET: z.string().optional(),
  
  // OpenAI
  OPENAI_API_KEY: z.string().startsWith('sk-').optional(),
  
  // Encryption (CRÍTICO se usar GSC)
  ENCRYPTION_KEY: z.string().min(32).optional(),
  ENCRYPTION_SALT: z.string().min(16).optional(),
  
  // App
  VITE_APP_URL: z.string().url().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().regex(/^\d+$/).transform(Number).optional(),
  
  // Admin
  OWNER_OPEN_ID: z.string().optional(),
});

let validatedEnv: z.infer<typeof envSchema>;

try {
  validatedEnv = envSchema.parse(process.env);
  
  // Validações condicionais
  if (process.env.NODE_ENV === 'production') {
    if (!validatedEnv.DATABASE_URL) {
      throw new Error('DATABASE_URL é obrigatório em produção');
    }
    if (!validatedEnv.ENCRYPTION_KEY) {
      console.warn('⚠️  ENCRYPTION_KEY não configurado - tokens OAuth NÃO serão criptografados!');
    }
  }
} catch (error) {
  console.error('❌ Erro na validação de variáveis de ambiente:');
  if (error instanceof z.ZodError) {
    error.errors.forEach((err) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
  } else {
    console.error(error);
  }
  process.exit(1);
}

export const ENV = validatedEnv;
```

---

## 🟠 PROBLEMA 7: Observabilidade Básica

### Solução: Logging estruturado

**Instalar dependência:**
```bash
pnpm add pino pino-pretty
```

**Arquivo: `server/_core/logger.ts`**

```typescript
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname',
    },
  } : undefined,
});

// Helpers
export const log = {
  info: (msg: string, data?: object) => logger.info(data, msg),
  error: (msg: string, error?: unknown) => logger.error({ error }, msg),
  warn: (msg: string, data?: object) => logger.warn(data, msg),
  debug: (msg: string, data?: object) => logger.debug(data, msg),
};
```

**Atualizar `server/_core/trpc.ts`:**

```typescript
import { log } from './logger';

export const publicProcedure = t.procedure.use(async ({ path, type, next }) => {
  const start = Date.now();
  
  try {
    const result = await next();
    const duration = Date.now() - start;
    
    log.info('tRPC request completed', {
      path,
      type,
      duration,
      success: true,
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    
    log.error('tRPC request failed', {
      path,
      type,
      duration,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    throw error;
  }
});
```

---

## 📝 CHECKLIST DE IMPLEMENTAÇÃO

### Sprint 1 (Segurança - 1 semana):
- [ ] Implementar criptografia de tokens (`encryption.ts`)
- [ ] Atualizar `upsertGscToken` e `getGscToken`
- [ ] Adicionar `ENCRYPTION_KEY` ao `.env`
- [ ] Implementar rate limiting (`rateLimiter.ts`)
- [ ] Adicionar rate limiters ao `index.ts`
- [ ] Criar middleware de ownership (`ownership.ts`)
- [ ] Aplicar verificação em TODOS os endpoints de mutação
- [ ] Testar cada mudança isoladamente

### Sprint 2 (Performance - 1 semana):
- [ ] Adicionar índices ao schema (`drizzle/schema.ts`)
- [ ] Gerar e aplicar migrations
- [ ] Refatorar `getRankingsSummary` (remover N+1)
- [ ] Validar ENV vars (`env.ts`)
- [ ] Implementar logging estruturado (`logger.ts`)
- [ ] Adicionar logs em pontos críticos
- [ ] Testar performance com dados de exemplo

### Após implementação:
```bash
# 1. Instalar dependências
pnpm install

# 2. Gerar migrations
pnpm drizzle-kit generate

# 3. Aplicar migrations
pnpm drizzle-kit migrate

# 4. Verificar tipos
pnpm check

# 5. Rodar testes
pnpm test
```

---

## ⚡ COMANDOS RÁPIDOS

```bash
# Gerar chave de criptografia
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Testar conexão DB
pnpm drizzle-kit studio

# Verificar tipos
pnpm check

# Build
pnpm build
```

---

## 🎯 IMPACTO ESPERADO

Após implementar estas correções:

✅ **Segurança:** Tokens criptografados, rate limiting, validação de ownership  
✅ **Performance:** Queries 10-50x mais rápidas com índices  
✅ **Confiabilidade:** Logs estruturados para debugging  
✅ **Manutenibilidade:** Código mais robusto e testável  

**Tempo estimado:** 2 semanas de 1 desenvolvedor full-time  
**Risco:** MÉDIO (mudanças em código crítico, testar bem antes de produção)
