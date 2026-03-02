import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@/lib/db'
import { account, rateLimit, session, user, verification } from './schema'

const appUrl = process.env.BETTER_AUTH_URL
const trustedOrigins = ['http://localhost:3000', ...(appUrl ? [appUrl] : [])]
const isProduction = process.env.NODE_ENV === 'production'

export const auth = betterAuth({
  appName: 'Solo',
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: { account, session, user, verification, rateLimit },
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
    storage: isProduction ? 'database' : 'memory',
  },
  trustedOrigins,
  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
  },
})
