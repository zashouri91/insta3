-- First, create a backup of existing user roles using text type instead
CREATE TABLE IF NOT EXISTS user_role_backup AS 
SELECT id, role::text as role FROM users;

-- Drop existing policies that depend on user_role
DROP POLICY IF EXISTS "Only admins can insert organizations" ON organizations;
DROP POLICY IF EXISTS "Only admins can update organizations" ON organizations;
DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;

-- Remove the default value constraint
ALTER TABLE users ALTER COLUMN role DROP DEFAULT;

-- Temporarily change the users.role column to text
ALTER TABLE users ALTER COLUMN role TYPE text;

-- Now we can safely drop and recreate the enum
DROP TYPE user_role;
CREATE TYPE user_role AS ENUM ('user', 'manager', 'admin');

-- Convert the role column back to the new enum type and set default
ALTER TABLE users 
    ALTER COLUMN role TYPE user_role USING role::user_role,
    ALTER COLUMN role SET DEFAULT 'user'::user_role;

-- Restore user roles, converting existing admins to admins and users to users
UPDATE users 
SET role = CASE 
    WHEN user_role_backup.role = 'admin' THEN 'admin'::user_role
    ELSE 'user'::user_role
END
FROM user_role_backup
WHERE users.id = user_role_backup.id;

-- Clean up backup table
DROP TABLE user_role_backup;

-- Organizations policies
CREATE POLICY "Users can view their organization" ON organizations
    FOR SELECT USING (
        id IN (SELECT organization_id FROM users WHERE users.id = auth.uid())
    );

CREATE POLICY "Managers and admins can update their organization" ON organizations
    FOR UPDATE USING (
        id IN (
            SELECT organization_id 
            FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('manager', 'admin')
        )
    );

-- Groups policies
DROP POLICY IF EXISTS "Users can view groups in their organization" ON groups;
CREATE POLICY "Users can view groups in their organization" ON groups
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM users 
            WHERE users.id = auth.uid()
        )
    );

CREATE POLICY "Managers and admins can manage groups" ON groups
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id 
            FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('manager', 'admin')
        )
    );

-- Locations policies
DROP POLICY IF EXISTS "Users can view locations in their organization" ON locations;
CREATE POLICY "Users can view locations in their organization" ON locations
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM users 
            WHERE users.id = auth.uid()
        )
    );

CREATE POLICY "Managers and admins can manage locations" ON locations
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id 
            FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('manager', 'admin')
        )
    );

-- Users policies
DROP POLICY IF EXISTS "Users can view users in their organization" ON users;
CREATE POLICY "Users can view users in their organization" ON users
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM users 
            WHERE users.id = auth.uid()
        )
    );

CREATE POLICY "Managers can manage regular users" ON users
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id 
            FROM users u1 
            WHERE u1.id = auth.uid() 
            AND u1.role = 'manager'
        )
        AND role = 'user'
    );

CREATE POLICY "Admins can manage all users" ON users
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id 
            FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Surveys policies
DROP POLICY IF EXISTS "Users can view surveys" ON surveys;
CREATE POLICY "Users can view surveys" ON surveys
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM users 
            WHERE users.id = auth.uid()
        )
    );

CREATE POLICY "Managers and admins can manage surveys" ON surveys
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id 
            FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('manager', 'admin')
        )
    );

-- Feedback policies
DROP POLICY IF EXISTS "Users can manage their own feedback" ON feedback;
CREATE POLICY "Users can manage their own feedback" ON feedback
    FOR ALL USING (
        user_id = auth.uid()
    );

CREATE POLICY "Managers and admins can view all feedback" ON feedback
    FOR SELECT USING (
        survey_id IN (
            SELECT id 
            FROM surveys 
            WHERE organization_id IN (
                SELECT organization_id 
                FROM users 
                WHERE users.id = auth.uid() 
                AND users.role IN ('manager', 'admin')
            )
        )
    );

-- Answers policies
DROP POLICY IF EXISTS "Users can manage their own answers" ON answers;
CREATE POLICY "Users can manage their own answers" ON answers
    FOR ALL USING (
        feedback_id IN (
            SELECT id 
            FROM feedback 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Managers and admins can view all answers" ON answers
    FOR SELECT USING (
        feedback_id IN (
            SELECT id 
            FROM feedback 
            WHERE survey_id IN (
                SELECT id 
                FROM surveys 
                WHERE organization_id IN (
                    SELECT organization_id 
                    FROM users 
                    WHERE users.id = auth.uid() 
                    AND users.role IN ('manager', 'admin')
                )
            )
        )
    );

-- Signatures policies
DROP POLICY IF EXISTS "Users can manage their own signatures" ON signatures;
CREATE POLICY "Users can manage their own signatures" ON signatures
    FOR ALL USING (
        user_id = auth.uid()
    );

CREATE POLICY "Managers and admins can view all signatures" ON signatures
    FOR SELECT USING (
        user_id IN (
            SELECT id 
            FROM users 
            WHERE organization_id IN (
                SELECT organization_id 
                FROM users 
                WHERE users.id = auth.uid() 
                AND users.role IN ('manager', 'admin')
            )
        )
    );
