import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@/lib/db'
import { account, session, user, verification } from './schema'

const appUrl = process.env.BETTER_AUTH_URL
const trustedOrigins = ['http://localhost:3000', ...(appUrl ? [appUrl] : [])]

export const auth = betterAuth({
  appName: 'Solo',
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: { account, session, user, verification },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 5,
    storage: 'database',
  },
  trustedOrigins,
  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
  },
})

export type Auth = typeof auth
