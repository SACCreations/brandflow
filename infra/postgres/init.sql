-- BrandFlow PostgreSQL initialization
-- Sets up extensions and RLS helper function

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable pg_trgm for full-text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enable vector extension for embeddings (pgvector)
CREATE EXTENSION IF NOT EXISTS "vector";

-- Helper function: get the current tenant from session variable
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN current_setting('app.current_tenant_id', true)::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Create shadow database for Prisma migrations
-- (only runs if shadow DB doesn't exist)
SELECT 'CREATE DATABASE brandflow_shadow'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'brandflow_shadow')\gexec
