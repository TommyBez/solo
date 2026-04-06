import { organizationClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

function getBaseURL() {
  if (typeof window !== 'undefined') {
    // Client-side: use window.location.origin for dynamic URL detection
    return window.location.origin
  }
  // Server-side fallback
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
