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
      retryAfter: res.getHeader('Retry-After'),
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
