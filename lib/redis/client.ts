import { Redis } from '@upstash/redis'

const url = process.env.KV_REST_API_URL
const token = process.env.KV_REST_API_TOKEN

if (!(url && token)) {
  throw new Error('KV_REST_API_URL and KV_REST_API_TOKEN must be set for Redis')
}

export const redis = new Redis({ url, token })
