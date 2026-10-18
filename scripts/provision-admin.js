#!/usr/bin/env node
/**
 * TECH EXPERT 2K26 — SECURE ADMIN PROVISIONING SCRIPT
 * Sri Venkateswara College of Engineering (SVCE)
 *
 * This administrative script provisions the initial bootstrap administrator account
 * in Supabase Auth and registers the trusted server-side super_admin role record.
 * 
 * Usage:
 *   node scripts/provision-admin.js
 * Or with custom env:
 *   ADMIN_INITIAL_EMAIL=... ADMIN_INITIAL_PASSWORD=... node scripts/provision-admin.js
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Load .env or .env.local if present
const envPath = resolve(process.cwd(), '.env');
if (existsSync(envPath)) {
  const envConfig = dotenv.parse(readFileSync(envPath));
  for (const k in envConfig) {
    if (!process.env[k]) {
      process.env[k] = envConfig[k];
    }
  }
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = process.env.ADMIN_INITIAL_EMAIL || 'svce.techexpert.2K26@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_INITIAL_PASSWORD;

console.log('---------------------------------------------------------');
console.log('TECH EXPERT 2K26 — SECURE ADMIN PROVISIONING UTILITY');
console.log('---------------------------------------------------------');

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('[!] Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured.');
  console.log('    Please set them in your local .env file or environment variables.');
  process.exit(1);
}

if (!ADMIN_PASSWORD) {
  console.error('[!] Error: ADMIN_INITIAL_PASSWORD must be provided via environment variable.');
  console.log('    Do not hardcode or commit this password into version control.');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function provision() {
  try {
    console.log(`[*] Connecting to Supabase at: ${SUPABASE_URL}`);
    console.log(`[*] Target initial admin email: ${ADMIN_EMAIL}`);

    // Check if user already exists
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      throw new Error(`Failed to query users: ${listError.message}`);
    }

    let existingAdmin = usersData.users.find(u => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());
    let adminUserId = existingAdmin?.id;

    if (!existingAdmin) {
      console.log('[*] Admin user does not exist in Auth. Creating user...');
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: 'Lead Organizer / Admin',
          role: 'super_admin'
        }
      });

      if (createError) {
        throw new Error(`Failed to create admin user: ${createError.message}`);
      }

      adminUserId = newUser.user.id;
      console.log(`[+] Created auth user successfully with UUID: ${adminUserId}`);
    } else {
      console.log(`[*] Admin user found with UUID: ${adminUserId}. Updating credentials...`);
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(adminUserId, {
        password: ADMIN_PASSWORD,
        email_confirm: true
      });

      if (updateError) {
        throw new Error(`Failed to update admin password: ${updateError.message}`);
      }
      console.log('[+] Password updated for existing administrator.');
    }

    // Provision admin_roles record
    console.log('[*] Granting trusted super_admin role in database...');
    const { error: roleError } = await supabaseAdmin
      .from('admin_roles')
      .upsert({
        user_id: adminUserId,
        role: 'super_admin',
        status: 'active',
        must_change_password: true
      }, { onConflict: 'user_id' });

    if (roleError) {
      throw new Error(`Failed to set admin_roles: ${roleError.message}`);
    }

    // Also ensure profiles entry exists
    await supabaseAdmin
      .from('profiles')
      .upsert({
        user_id: adminUserId,
        full_name: 'Lead Organizer / Admin',
        email: ADMIN_EMAIL,
        section: 'A',
        academic_year: 'III',
        registration_status: 'active'
      }, { onConflict: 'user_id' });

    // Record audit log entry
    await supabaseAdmin
      .from('admin_audit_logs')
      .insert({
        admin_id: adminUserId,
        action: 'PROVISION_INITIAL_ADMIN',
        target_type: 'admin_roles',
        target_id: adminUserId,
        change_summary: `Provisioned initial bootstrap administrator account: ${ADMIN_EMAIL}`,
        reason: 'Event setup initialization'
      });

    console.log('[SUCCESS] Administrator provisioned successfully!');
    console.log('---------------------------------------------------------');
    console.log('Security Checklist:');
    console.log('1. User is assigned super_admin role.');
    console.log('2. User will be required to change initial password on first login.');
    console.log('3. Remember to clear ADMIN_INITIAL_PASSWORD from environment after setup.');
    console.log('---------------------------------------------------------');

  } catch (err) {
    console.error('[!] Provisioning failed:', err.message);
    process.exit(1);
  }
}

provision();
