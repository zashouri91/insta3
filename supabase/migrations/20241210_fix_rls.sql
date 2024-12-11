-- Disable RLS temporarily
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Admins can view all data" ON users;
DROP POLICY IF EXISTS "Users can view users in their organization" ON users;
DROP POLICY IF EXISTS "Managers can manage regular users" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

-- Make sure organization exists
INSERT INTO organizations (id, name)
VALUES (
    '630a4c30-1107-4561-b84a-244c5decd7b8',
    'My Organization'
)
ON CONFLICT (id) DO NOTHING;

-- Update user record
UPDATE users
SET 
    organization_id = '630a4c30-1107-4561-b84a-244c5decd7b8',
    role = 'admin'
WHERE id = '8a4d30aa-bbfa-4949-b0ea-8ac81fbc6abe';

-- Create new simplified policies
CREATE POLICY "enable_read_for_all_users"
ON users FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "enable_update_for_own_user"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Re-enable RLS with new policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
