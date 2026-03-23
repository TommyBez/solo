import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function run() {
  const result = await sql`ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN NOT NULL DEFAULT true`;
  console.log('Migration completed successfully');
  console.log('Result:', result);
}

run().catch(console.error);
