// TECH EXPERT 2K26 — AUTHENTICATION & AUTHORIZATION CONTEXT
// Sri Venkateswara College of Engineering (SVCE)

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Profile, AdminRole } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  adminRole: AdminRole | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  mustChangePassword: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfileAndRole = useCallback(async (currentUser: User) => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch Participant Profile
      const { data: profData, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (!profError && profData) {
        setProfile(profData as Profile);
      }

      // 2. Fetch Admin Role (Server-verified record)
      const { data: roleData, error: roleError } = await supabase
        .from('admin_roles')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('status', 'active')
        .maybeSingle();

      if (!roleError && roleData) {
        setAdminRole(roleData as AdminRole);
      } else {
        setAdminRole(null);
      }
    } catch (err) {
      console.error('[AuthContext] Error loading user details:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession?.user) {
        fetchProfileAndRole(initialSession.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        await fetchProfileAndRole(newSession.user);
      } else {
        setProfile(null);
        setAdminRole(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfileAndRole]);

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setProfile(null);
    setAdminRole(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfileAndRole(user);
    }
  };

  const updatePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      // Update must_change_password flag in admin_roles
      if (adminRole) {
        await supabase
          .from('admin_roles')
          .update({ must_change_password: false })
          .eq('user_id', user.id);

        setAdminRole(prev => prev ? { ...prev, must_change_password: false } : null);

        // Record in audit log
        await supabase
          .from('admin_audit_logs')
          .insert({
            admin_id: user.id,
            action: 'ADMIN_PASSWORD_UPDATED',
            target_type: 'admin_roles',
            target_id: user.id,
            change_summary: 'Administrator changed their initial/existing password',
            reason: 'Security compliance'
          });
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update password' };
    }
  };

  const isAdmin = Boolean(adminRole && adminRole.status === 'active');
  const isSuperAdmin = Boolean(adminRole && adminRole.role === 'super_admin' && adminRole.status === 'active');
  const mustChangePassword = Boolean(adminRole?.must_change_password);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        adminRole,
        isAdmin,
        isSuperAdmin,
        mustChangePassword,
        loading,
        signOut,
        refreshProfile,
        updatePassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
