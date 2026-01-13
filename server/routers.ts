import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Keywords router
  keywords: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getUserKeywords } = await import("./db");
      return await getUserKeywords(ctx.user.id);
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const { getKeywordById } = await import("./db");
        return await getKeywordById(input.id, ctx.user.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        keyword: z.string().min(1),
        url: z.string().url(),
        location: z.string().optional(),
        targetPosition: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { createKeyword } = await import("./db");
        const id = await createKeyword({
          userId: ctx.user.id,
          ...input,
        });
        return { id, success: true };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        keyword: z.string().min(1).optional(),
        url: z.string().url().optional(),
        location: z.string().optional(),
        targetPosition: z.number().optional(),
        isActive: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const { updateKeyword } = await import("./db");
        await updateKeyword(id, ctx.user.id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { deleteKeyword } = await import("./db");
        await deleteKeyword(input.id, ctx.user.id);
        return { success: true };
      }),
  }),
  
  // Rankings router
  rankings: router({
    getHistory: protectedProcedure
      .input(z.object({ keywordId: z.number(), limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const { getRankingsByKeyword } = await import("./db");
        return await getRankingsByKeyword(input.keywordId, ctx.user.id, input.limit);
      }),
    
    getLatest: protectedProcedure
      .input(z.object({ keywordId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { getLatestRanking } = await import("./db");
        return await getLatestRanking(input.keywordId, ctx.user.id);
      }),
    
    getSummary: protectedProcedure.query(async ({ ctx }) => {
      const { getRankingsSummary } = await import("./db");
      return await getRankingsSummary(ctx.user.id);
    }),
  }),
  
  // GSC Auth router
  gsc: router({
    getAuthUrl: protectedProcedure.query(() => {
      // TODO: Implement Google OAuth URL generation
      const redirectUri = process.env.VITE_APP_URL || "http://localhost:3000";
      const clientId = process.env.GSC_CLIENT_ID || "";
      const scope = "https://www.googleapis.com/auth/webmasters.readonly";
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${redirectUri}/api/gsc/callback&` +
        `response_type=code&` +
        `scope=${scope}&` +
        `access_type=offline&` +
        `prompt=consent`;
      
      return { authUrl };
    }),
    
    getStatus: protectedProcedure.query(async ({ ctx }) => {
      const { getGscToken } = await import("./db");
      const token = await getGscToken(ctx.user.id);
      return {
        connected: !!token,
        siteUrl: token?.siteUrl || null,
        expiresAt: token?.expiresAt || null,
      };
    }),
    
    disconnect: protectedProcedure.mutation(async ({ ctx }) => {
      const { deleteGscToken } = await import("./db");
      await deleteGscToken(ctx.user.id);
      return { success: true };
    }),
  }),
  
  // Alerts router
  alerts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getUserAlerts } = await import("./db");
      return await getUserAlerts(ctx.user.id);
    }),
    
    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { markAlertAsRead } = await import("./db");
        await markAlertAsRead(input.id, ctx.user.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
