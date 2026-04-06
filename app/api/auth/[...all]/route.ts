import { toNextJsHandler } from 'better-auth/next-js'
import { auth } from '@/lib/auth/server'

const handler = toNextJsHandler(auth)

export async function GET(request: Request) {
  console.log('[v0] Auth GET - Origin:', request.headers.get('origin'))
  console.log('[v0] Auth GET - URL:', request.url)
  console.log('[v0] VERCEL_URL:', process.env.VERCEL_URL)
  console.log('[v0] VERCEL_BRANCH_URL:', process.env.VERCEL_BRANCH_URL)
  console.log('[v0] BETTER_AUTH_URL:', process.env.BETTER_AUTH_URL)
  return handler.GET(request)
}

export async function POST(request: Request) {
  console.log('[v0] Auth POST - Origin:', request.headers.get('origin'))
  console.log('[v0] Auth POST - URL:', request.url)
  console.log('[v0] VERCEL_URL:', process.env.VERCEL_URL)
  console.log('[v0] VERCEL_BRANCH_URL:', process.env.VERCEL_BRANCH_URL)
  console.log('[v0] BETTER_AUTH_URL:', process.env.BETTER_AUTH_URL)
  return handler.POST(request)
}
