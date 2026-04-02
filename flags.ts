import { vercelAdapter } from '@flags-sdk/vercel'
import { dedupe, flag } from 'flags/next'
import { getSession } from '@/lib/auth/session'

interface FlagEntities {
  user?: {
    email: string
    id: string
  }
}

function getAiAllowedEmails() {
  return new Set(
    (process.env.AI_ALLOWED_EMAILS ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  )
}

const aiFeaturesAdapter = process.env.FLAGS
  ? vercelAdapter<boolean, FlagEntities>()
  : undefined

const identifyCurrentUser = dedupe(async (): Promise<FlagEntities> => {
  const session = await getSession()

  if (!session?.user?.email) {
    return {}
  }

  return {
    user: {
      email: session.user.email,
      id: session.user.id,
    },
  }
})

export const aiFeaturesFlag = flag<boolean, FlagEntities>({
  key: 'ai-features',
  identify: identifyCurrentUser,
  defaultValue: false,
  description: 'Enable AI-powered time tracking features for beta users',
  ...(aiFeaturesAdapter ? { adapter: aiFeaturesAdapter } : {}),
  decide({ entities }) {
    const email = entities?.user?.email?.toLowerCase()
    if (!email) {
      return false
    }

    return getAiAllowedEmails().has(email)
  },
  options: [
    { value: false, label: 'Disabled' },
    { value: true, label: 'Enabled' },
  ],
})

export function isAiFeaturesEnabled() {
  return aiFeaturesFlag()
}
