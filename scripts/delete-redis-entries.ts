import { Redis } from '@upstash/redis'

const url = process.env.KV_REST_API_URL
const token = process.env.KV_REST_API_TOKEN

if (!(url && token)) {
  throw new Error('KV_REST_API_URL and KV_REST_API_TOKEN must be set')
}

const redis = new Redis({ url, token })

async function deleteAllRedisEntries() {
  try {
    console.log('Starting deletion of all Redis entries...')

    // Get all keys matching the ai-suggestions pattern
    const keys = await redis.keys('ai-suggestions:*')
    console.log(`Found ${keys.length} suggestion cache entries`)

    if (keys.length > 0) {
      // Delete all suggestion cache entries
      for (const key of keys) {
        await redis.del(key)
        console.log(`Deleted: ${key}`)
      }
      console.log(`Successfully deleted ${keys.length} suggestion cache entries`)
    } else {
      console.log('No suggestion cache entries found')
    }

    // Optionally get stats on remaining keys
    const allKeys = await redis.keys('*')
    console.log(`\nRemaining Redis keys: ${allKeys.length}`)
    if (allKeys.length > 0) {
      console.log('Remaining keys:')
      allKeys.forEach((key) => console.log(`  - ${key}`))
    }
  } catch (error) {
    console.error('Error deleting Redis entries:', error)
    process.exit(1)
  }
}

deleteAllRedisEntries()
