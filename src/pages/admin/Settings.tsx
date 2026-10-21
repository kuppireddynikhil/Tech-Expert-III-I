// TECH EXPERT 2K26 — EVENT SETTINGS & SYSTEM CONFIGURATION
// Sri Venkateswara College of Engineering (SVCE)

import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import type { CompetitionSettings } from '../../types';
import {
  Settings as SettingsIcon,
  Save,
  Shield,
  KeyRound,
  Server,
  Cpu,
  Database
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { updatePassword } = useAuth();
  const [, setSettings] = useState<CompetitionSettings | null>(null);
  const [eventName, setEventName] = useState('Tech Expert 2K26');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Password Update
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [updatingPass, setUpdatingPass] = useState(false);

  useEffect(() => {
    api.getCompetitionSettings().then((s) => {
      setSettings(s);
      if (s?.event_name) setEventName(s.event_name);
    });
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      await api.updateCompetitionSettings({ event_name: eventName }, 'Updated competition name');
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err: any) {
      alert(`Failed to save settings: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 8 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setUpdatingPass(true);
    const result = await updatePassword(newPassword);
    setUpdatingPass(false);

    if (result.success) {
      setPasswordMsg({ type: 'success', text: 'Administrator password updated successfully!' });
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordMsg({ type: 'error', text: result.error || 'Failed to update password' });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px' }}>
      {/* Header */}
      <div>
        <div className="badge badge-primary" style={{ marginBottom: '0.4rem' }}>
          Event Parameters
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text)' }}>Platform Settings</h1>
        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
          Configure global event titles, monitor system infrastructure, and update administrator credentials.
        </div>
      </div>

      {/* Infrastructure Diagnostics */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text)' }}>
          <Server size={18} color="var(--color-primary)" /> System Infrastructure Status
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: 'var(--color-surface-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Database size={16} color="var(--color-primary)" />
              <span style={{ fontWeight: 500, color: 'var(--color-text)' }}>Supabase PostgreSQL & RLS</span>
            </div>
            <span className={`badge ${isSupabaseConfigured ? 'badge-success' : 'badge-warning'}`}>
              {isSupabaseConfigured ? 'CONNECTED' : 'LOCAL PREVIEW MODE'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: 'var(--color-surface-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Cpu size={16} color="var(--color-primary)" />
              <span style={{ fontWeight: 500, color: 'var(--color-text)' }}>Google Gemini AI Evaluation Engine</span>
            </div>
            <span className="badge badge-success">
              GEMINI 2.5 FLASH CONFIGURED
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: 'var(--color-surface-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Shield size={16} color="var(--color-primary)" />
              <span style={{ fontWeight: 500, color: 'var(--color-text)' }}>Host Institution</span>
            </div>
            <span className="badge badge-primary">
              Sri Venkateswara College of Engineering (SVCE)
            </span>
          </div>
        </div>
      </div>

      {/* Competition Details */}
      <form onSubmit={handleSaveSettings} className="card" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text)' }}>
          <SettingsIcon size={18} color="var(--color-primary)" /> General Event Information
        </h3>

        {savedSuccess && <div className="alert alert-success">Settings saved successfully!</div>}

        <div className="form-group">
          <label className="form-label">Competition Event Name</label>
          <input
            type="text"
            className="form-input"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={saving} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <Save size={15} /> {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </form>

      {/* Admin Security / Password Change */}
      <form onSubmit={handleChangePassword} className="card" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text)' }}>
          <KeyRound size={18} color="var(--color-warning)" /> Administrator Password Management
        </h3>

        {passwordMsg && (
          <div className={`alert ${passwordMsg.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
            {passwordMsg.text}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">New Password</label>
          <input
            type="password"
            className="form-input"
            placeholder="Minimum 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Confirm New Password</label>
          <input
            type="password"
            className="form-input"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={updatingPass} className="btn btn-primary">
          {updatingPass ? 'Updating Credentials...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
};
