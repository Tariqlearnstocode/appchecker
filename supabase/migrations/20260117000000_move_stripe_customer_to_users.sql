-- Move stripe_customer_id from stripe_customers table to users table
-- This simplifies the schema and removes the need for a separate table

-- Add stripe_customer_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS users_stripe_customer_id_idx ON users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- Migrate existing data from stripe_customers to users table
UPDATE users u
SET stripe_customer_id = sc.stripe_customer_id
FROM stripe_customers sc
WHERE u.id = sc.id
  AND u.stripe_customer_id IS NULL;

-- Drop the stripe_customers table (no longer needed)
DROP TABLE IF EXISTS stripe_customers;
