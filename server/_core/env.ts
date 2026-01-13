import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url().optional(),
  
  // OAuth
  MANUS_OAUTH_CLIENT_ID: z.string().min(1).optional(),
  MANUS_OAUTH_CLIENT_SECRET: z.string().min(1).optional(),
  MANUS_OAUTH_CALLBACK_URL: z.string().url().optional(),
  OAUTH_SERVER_URL: z.string().optional(),
  
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
  VITE_APP_ID: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().regex(/^\d+$/).transform(Number).optional(),
  
  // Admin
  OWNER_OPEN_ID: z.string().optional(),
  
  // JWT
  JWT_SECRET: z.string().optional(),
  
  // Forge
  BUILT_IN_FORGE_API_URL: z.string().optional(),
  BUILT_IN_FORGE_API_KEY: z.string().optional(),
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
    error.issues.forEach((err: z.ZodIssue) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
  } else {
    console.error(error);
  }
  process.exit(1);
}

export const ENV = {
  appId: validatedEnv.VITE_APP_ID ?? "",
  cookieSecret: validatedEnv.JWT_SECRET ?? "",
  databaseUrl: validatedEnv.DATABASE_URL ?? "",
  oAuthServerUrl: validatedEnv.OAUTH_SERVER_URL ?? "",
  ownerOpenId: validatedEnv.OWNER_OPEN_ID ?? "",
  isProduction: validatedEnv.NODE_ENV === "production",
  forgeApiUrl: validatedEnv.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: validatedEnv.BUILT_IN_FORGE_API_KEY ?? "",
};
