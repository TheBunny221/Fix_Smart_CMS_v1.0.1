-- Fix_Smart_CMS   - Database Initialization Script
-- PostgreSQL initialization for Docker deployment

-- Create database if it doesn't exist (handled by POSTGRES_DB environment variable)
-- This script runs after the main database is created

-- Set timezone
SET timezone = 'UTC';

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create application user with limited privileges (if not created by environment variables)
-- Note: Main user creation is handled by POSTGRES_USER environment variable

-- Set default configuration for better performance
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h ';

-- Reload configuration
SELECT pg_reload_conf();

-- Create schema for application (Prisma will handle table creation)
-- This ensures the database is ready for Prisma migrations

-- Log successful initialization
INSERT INTO pg_stat_statements_info VALUES ('Database initialized for Fix_Smart_CMS  ');

-- Display initialization completion message
DO $$
BEGIN
    RAISE NOTICE 'Fix_Smart_CMS database initialization completed successfully';
    RAISE NOTICE 'Database: %', current_database();
    RAISE NOTICE 'User: %', current_user;
    RAISE NOTICE 'Timestamp: %', now();
END $$;