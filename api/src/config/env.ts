import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(8081),
    MONGODB_URI: z.string().min(1).default('mongodb://localhost:27017/cubid'),
    CORS_ORIGIN: z.string().min(1).default('http://localhost:5173'),
    SOCKET_CORS_ORIGIN: z.string().min(1).default('http://localhost:5173'),
    JWT_ACCESS_SECRET: z.string().min(16).default('dev-access-secret-change-me'),
    JWT_REFRESH_SECRET: z.string().min(16).default('dev-refresh-secret-change-me'),
    COOKIE_SECRET: z.string().min(16).default('dev-cookie-secret-change-me'),
    ACCESS_TOKEN_TTL: z.string().min(1).default('15m'),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
    PAYMENT_GATEWAY: z.enum(['mock', 'razorpay', 'stripe']).default('mock')
  })
  .superRefine((value, ctx) => {
    if (value.NODE_ENV !== 'production') {
      return;
    }

    const unsafeValues = new Set([
      'dev-access-secret-change-me',
      'dev-refresh-secret-change-me',
      'dev-cookie-secret-change-me'
    ]);

    if (unsafeValues.has(value.JWT_ACCESS_SECRET)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_ACCESS_SECRET'],
        message: 'Production JWT access secret must be changed'
      });
    }

    if (unsafeValues.has(value.JWT_REFRESH_SECRET)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_REFRESH_SECRET'],
        message: 'Production JWT refresh secret must be changed'
      });
    }

    if (unsafeValues.has(value.COOKIE_SECRET)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['COOKIE_SECRET'],
        message: 'Production cookie secret must be changed'
      });
    }

    if (value.CORS_ORIGIN === '*') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['CORS_ORIGIN'],
        message: 'Production CORS origin cannot be wildcard'
      });
    }
  });

const parsedEnv = envSchema.parse(process.env);

export const env = Object.freeze({
  nodeEnv: parsedEnv.NODE_ENV,
  isProduction: parsedEnv.NODE_ENV === 'production',
  isTest: parsedEnv.NODE_ENV === 'test',
  port: parsedEnv.PORT,
  mongodbUri: parsedEnv.MONGODB_URI,
  corsOrigin: parsedEnv.CORS_ORIGIN,
  socketCorsOrigin: parsedEnv.SOCKET_CORS_ORIGIN,
  jwtAccessSecret: parsedEnv.JWT_ACCESS_SECRET,
  jwtRefreshSecret: parsedEnv.JWT_REFRESH_SECRET,
  cookieSecret: parsedEnv.COOKIE_SECRET,
  accessTokenTtl: parsedEnv.ACCESS_TOKEN_TTL,
  refreshTokenTtlDays: parsedEnv.REFRESH_TOKEN_TTL_DAYS,
  rateLimitWindowMs: parsedEnv.RATE_LIMIT_WINDOW_MS,
  rateLimitMax: parsedEnv.RATE_LIMIT_MAX,
  paymentGateway: parsedEnv.PAYMENT_GATEWAY
});

export type AppEnv = typeof env;
