-- ============================================================================
-- TECH EXPERT 2K26 — FIX RLS RECURSION & FULL ADMIN PROVISIONING
-- Run this complete script in Supabase Dashboard -> SQL Editor
-- ============================================================================

-- 1. Drop ALL previous policies on admin_roles to prevent duplicates & recursion
DROP POLICY IF EXISTS "Admins can read admin_roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Users can read own admin role" ON public.admin_roles;
DROP POLICY IF EXISTS "Super admins can manage admin_roles" ON public.admin_roles;

-- 2. Create the clean, non-recursive SELECT policy
CREATE POLICY "Users can read own admin role" ON public.admin_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE user_id = p_user_id AND status = 'active'
  );
$$;

-- 3. Fix any existing NULL token columns across auth.users that trigger "Database error querying schema"
UPDATE auth.users
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  reauthentication_token = COALESCE(reauthentication_token, '');

-- 4. Clean previous failed admin user attempts if any
DELETE FROM auth.identities 
WHERE identity_data->>'email' = 'svce.techexpert.2K26@gmail.com' 
   OR provider_id = 'svce.techexpert.2K26@gmail.com';

DELETE FROM auth.users 
WHERE email = 'svce.techexpert.2K26@gmail.com';

-- 5. Insert clean Admin User and matching Identity record
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ 
DECLARE 
    v_user_id UUID := gen_random_uuid();
    v_admin_email TEXT := 'svce.techexpert.2K26@gmail.com';
    v_admin_password TEXT := 'TechExpert.com';
    v_encrypted_pw TEXT := crypt(v_admin_password, gen_salt('bf'));
BEGIN
    -- 1. Insert into auth.users with ALL required non-null string fields for GoTrue scanner
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change,
        phone_change,
        phone_change_token,
        email_change_token_current,
        reauthentication_token,
        is_sso_user,
        is_anonymous
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        v_user_id,
        'authenticated',
        'authenticated',
        v_admin_email,
        v_encrypted_pw,
        now(),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"full_name":"Lead Organizer / Admin","section":"A","academic_year":"III"}'::jsonb,
        false,
        now(),
        now(),
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        false,
        false
    );

    -- 2. Insert into auth.identities (Required by Supabase GoTrue Auth)
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        v_user_id,
        format('{"sub":"%s","email":"%s"}', v_user_id, v_admin_email)::jsonb,
        'email',
        v_admin_email,
        now(),
        now(),
        now()
    );

    -- 3. Set super_admin role in admin_roles
    INSERT INTO public.admin_roles (user_id, role, status, must_change_password)
    VALUES (v_user_id, 'super_admin', 'active', false)
    ON CONFLICT (user_id) DO UPDATE SET
      role = 'super_admin',
      status = 'active',
      must_change_password = false;

    -- 4. Set profile
    INSERT INTO public.profiles (user_id, full_name, email, section, academic_year, registration_status)
    VALUES (v_user_id, 'Lead Organizer / Admin', v_admin_email, 'A', 'III', 'active')
    ON CONFLICT (user_id) DO UPDATE SET
      registration_status = 'active';

END $$;
