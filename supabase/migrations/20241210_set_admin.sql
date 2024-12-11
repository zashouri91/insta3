-- Set the current user as admin
UPDATE users
SET role = 'admin'::user_role
WHERE id = auth.uid();

-- Verify the update
SELECT id, email, role FROM users WHERE id = auth.uid();
