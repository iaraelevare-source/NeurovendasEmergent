import { TRPCError } from '@trpc/server';

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
