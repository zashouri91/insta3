-- Ensure at least one admin user exists
DO $$
DECLARE
    admin_exists boolean;
BEGIN
    -- Check if any admin exists
    SELECT EXISTS (
        SELECT 1 FROM users WHERE role = 'admin'::user_role
    ) INTO admin_exists;

    -- If no admin exists, set the first user as admin
    IF NOT admin_exists THEN
        UPDATE users
        SET role = 'admin'::user_role
        WHERE id = (SELECT id FROM users ORDER BY created_at ASC LIMIT 1);
    END IF;
END $$;
