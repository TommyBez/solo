import { getProviderData } from '@flags-sdk/vercel'
import { createFlagsDiscoveryEndpoint } from 'flags/next'
import { aiFeaturesFlag } from '@/flags'

export const GET = createFlagsDiscoveryEndpoint(() => {
  return getProviderData({ aiFeaturesFlag })
})
