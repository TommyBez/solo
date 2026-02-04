-- Authentication tables for better-auth

-- User table
CREATE TABLE IF NOT EXISTS "user" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "email_verified" BOOLEAN NOT NULL DEFAULT FALSE,
  "image" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Session table
CREATE TABLE IF NOT EXISTS "session" (
  "id" TEXT PRIMARY KEY,
  "expires_at" TIMESTAMP NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "ip_address" TEXT,
  "user_agent" TEXT,
  "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);

-- Account table (for OAuth providers)
CREATE TABLE IF NOT EXISTS "account" (
  "id" TEXT PRIMARY KEY,
  "account_id" TEXT NOT NULL,
  "provider_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "access_token" TEXT,
  "refresh_token" TEXT,
  "id_token" TEXT,
  "access_token_expires_at" TIMESTAMP,
  "refresh_token_expires_at" TIMESTAMP,
  "scope" TEXT,
  "password" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Verification table (for email verification)
CREATE TABLE IF NOT EXISTS "verification" (
  "id" TEXT PRIMARY KEY,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expires_at" TIMESTAMP NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add user_id to clients table
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "user_id" TEXT REFERENCES "user"("id") ON DELETE CASCADE;

-- Add user_id to areas table
ALTER TABLE "areas" ADD COLUMN IF NOT EXISTS "user_id" TEXT REFERENCES "user"("id") ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "session_user_id_idx" ON "session"("user_id");
CREATE INDEX IF NOT EXISTS "session_token_idx" ON "session"("token");
CREATE INDEX IF NOT EXISTS "account_user_id_idx" ON "account"("user_id");
CREATE INDEX IF NOT EXISTS "clients_user_id_idx" ON "clients"("user_id");
CREATE INDEX IF NOT EXISTS "areas_user_id_idx" ON "areas"("user_id");
