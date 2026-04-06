import { organizationClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

function getBaseURL() {
  // In browser, use relative URLs (same origin) to avoid CORS issues on preview deployments
  if (typeof window !== 'undefined') {
    return ''
  }
  // On server, use the configured URL or fallback to localhost
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

const authClient = createAuthClient({
  baseURL: getBaseURL(),
  plugins: [organizationClient()],
})

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  updateUser,
  changePassword,
  organization,
  useActiveOrganization,
  useListOrganizations,
} = authClient
