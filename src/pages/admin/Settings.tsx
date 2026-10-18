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
  CheckCircle2,
  AlertCircle,
  Server,
  Cpu,
  Database
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { user, updatePassword } = useAuth();
  const [settings, setSettings] = useState<CompetitionSettings | null>(null);
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
        <div className="badge badge-purple" style={{ marginBottom: '0.4rem' }}>
          Event Parameters
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Platform Settings</h1>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Configure global event titles, monitor system infrastructure, and update administrator credentials.
        </div>
      </div>

      {/* Infrastructure Diagnostics */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Server size={18} color="var(--cyan-400)" /> System Infrastructure Status
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Database size={16} color="var(--cyan-400)" />
              <span>Supabase PostgreSQL & RLS</span>
            </div>
            <span className={`badge ${isSupabaseConfigured ? 'badge-emerald' : 'badge-amber'}`}>
              {isSupabaseConfigured ? 'CONNECTED' : 'LOCAL PREVIEW MODE'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Cpu size={16} color="var(--purple-400)" />
              <span>Google Gemini AI Evaluation Engine</span>
            </div>
            <span className="badge badge-emerald">
              GEMINI 2.5 FLASH CONFIGURED
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Shield size={16} color="var(--emerald-400)" />
              <span>Host Institution</span>
            </div>
            <span className="badge badge-cyan">
              Sri Venkateswara College of Engineering (SVCE)
            </span>
          </div>
        </div>
      </div>

      {/* Competition Details */}
      <form onSubmit={handleSaveSettings} className="glass-card" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <SettingsIcon size={18} color="var(--purple-400)" /> General Event Information
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

        <button type="submit" disabled={saving} className="btn btn-primary">
          <Save size={15} /> {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </form>

      {/* Admin Security / Password Change */}
      <form onSubmit={handleChangePassword} className="glass-card" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <KeyRound size={18} color="var(--amber-400)" /> Administrator Password Management
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

        <button type="submit" disabled={updatingPass} className="btn btn-accent">
          {updatingPass ? 'Updating Credentials...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
};
