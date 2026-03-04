import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { organization as organizationPlugin } from 'better-auth/plugins'
import { db } from '@/lib/db'
import {
  account,
  invitation,
  member,
  organization,
  rateLimit,
  session,
  user,
  verification,
} from './schema'

const appUrl = process.env.BETTER_AUTH_URL
const trustedOrigins = ['http://localhost:3000', ...(appUrl ? [appUrl] : [])]
const isProduction = process.env.NODE_ENV === 'production'

export const auth = betterAuth({
  appName: 'Solo',
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      account,
      session,
      user,
      verification,
      rateLimit,
      organization,
      member,
      invitation,
    },
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
  plugins: [
    organizationPlugin({
      allowUserToCreateOrganization: true,
      organizationLimit: 5,
      creatorRole: 'owner',
    }),
  ],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const orgId = crypto.randomUUID()
          const slug =
            user.name
              .toLowerCase()
              .replace(/\s+/g, '-')
              .replace(/[^a-z0-9-]/g, '') || user.id
          await db.insert(organization).values({
            id: orgId,
            name: `${user.name}'s Workspace`,
            slug: `${slug}-${orgId.slice(0, 6)}`,
          })
          await db.insert(member).values({
            id: crypto.randomUUID(),
            organizationId: orgId,
            userId: user.id,
            role: 'owner',
          })
        },
      },
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
