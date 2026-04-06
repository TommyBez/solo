import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { organization as organizationPlugin } from 'better-auth/plugins'
import { createAccessControl } from 'better-auth/plugins/access'
import {
  defaultRoles,
  defaultStatements,
} from 'better-auth/plugins/organization/access'
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

const ac = createAccessControl(defaultStatements)
const viewer = ac.newRole({
  organization: [],
  member: [],
  invitation: [],
})

const appUrl = process.env.BETTER_AUTH_URL
const vercelUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : null
const vercelBranchUrl = process.env.VERCEL_BRANCH_URL
  ? `https://${process.env.VERCEL_BRANCH_URL}`
  : null

// Build trusted origins - using wildcards for dynamic environments
const trustedOrigins: string[] = [
  'http://localhost:3000',
  'https://*.vusercontent.net', // v0 preview environments
  'https://*.vercel.app', // Vercel preview deployments
  ...(appUrl ? [appUrl] : []),
  ...(vercelUrl ? [vercelUrl] : []),
  ...(vercelBranchUrl ? [vercelBranchUrl] : []),
]
const isProduction = process.env.NODE_ENV === 'production'
const isVercelEnvironment = !!process.env.VERCEL

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
      ac,
      roles: {
        ...(defaultRoles || {}),
        viewer,
      },
      allowUserToCreateOrganization: true,
      organizationLimit: 5,
      creatorRole: 'owner',
      sendInvitationEmail: async (data) => {
        const { sendEmail } = await import('@/lib/email')
        const baseUrl = appUrl || 'http://localhost:3000'
        const acceptUrl = `${baseUrl}/invitation/${data.invitation.id}`

        await sendEmail({
          to: data.email,
          subject: `Join ${data.organization.name} on Solo`,
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
              <h2>You've been invited!</h2>
              <p><strong>${data.inviter.user.name}</strong> invited you to join <strong>${data.organization.name}</strong> on Solo.</p>
              <p>
                <a href="${acceptUrl}" style="display: inline-block; padding: 12px 24px; background: #171717; color: #fff; text-decoration: none; border-radius: 4px;">
                  Accept Invitation
                </a>
              </p>
              <p style="color: #666; font-size: 14px;">Or copy this link: ${acceptUrl}</p>
              <p style="color: #999; font-size: 12px;">This invitation expires in 48 hours.</p>
            </div>
          `,
        })
      },
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
    // Use secure cookies when served over HTTPS (production or Vercel environments)
    useSecureCookies: isProduction || isVercelEnvironment,
    // Only enable cross-site cookie settings for Vercel environments (iframes like v0 preview)
    ...(isVercelEnvironment && {
      crossSubDomainCookies: {
        enabled: true,
      },
      defaultCookieAttributes: {
        sameSite: 'none' as const,
        secure: true,
      },
    }),
  },
})
