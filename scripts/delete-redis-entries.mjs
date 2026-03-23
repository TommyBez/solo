const url = process.env.KV_REST_API_URL
const token = process.env.KV_REST_API_TOKEN

if (!(url && token)) {
  throw new Error('KV_REST_API_URL and KV_REST_API_TOKEN must be set')
}

async function deleteAllRedisEntries() {
  try {
    console.log('Starting deletion of all Redis entries...')

    // Get all keys matching the ai-suggestions pattern
    const keysResponse = await fetch(`${url}/keys/ai-suggestions:*`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!keysResponse.ok) {
      throw new Error(`Failed to fetch keys: ${keysResponse.statusText}`)
    }

    const keysData = await keysResponse.json()
    const keys = keysData.result || []
    console.log(`Found ${keys.length} suggestion cache entries`)

    if (keys.length > 0) {
      // Delete all suggestion cache entries
      for (const key of keys) {
        const deleteResponse = await fetch(`${url}/del/${key}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!deleteResponse.ok) {
          console.warn(`Failed to delete ${key}: ${deleteResponse.statusText}`)
        } else {
          console.log(`Deleted: ${key}`)
        }
      }
      console.log(`Successfully deleted ${keys.length} suggestion cache entries`)
    } else {
      console.log('No suggestion cache entries found')
    }

    console.log('\nRedis entries cleanup completed!')
  } catch (error) {
    console.error('Error deleting Redis entries:', error)
    process.exit(1)
  }
}

deleteAllRedisEntries()
