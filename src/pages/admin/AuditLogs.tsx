// TECH EXPERT 2K26 — ADMINISTRATIVE AUDIT LOGS
// Sri Venkateswara College of Engineering (SVCE)

import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { AdminAuditLog } from '../../types';
import {
  History,
  Search,
  Filter,
  ShieldCheck,
  Calendar,
  FileText
} from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(l => 
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.change_summary.toLowerCase().includes(search.toLowerCase()) ||
    (l.reason && l.reason.toLowerCase().includes(search.toLowerCase())) ||
    (l.admin_email && l.admin_email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <div className="badge badge-purple" style={{ marginBottom: '0.4rem' }}>
          Compliance & Transparency
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>System Audit Logs</h1>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Immutable server-side audit records of all administrative actions, phase releases, timer changes, overrides, and account updates.
        </div>
      </div>

      {/* Search Bar */}
      <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search audit trail by action, keyword, admin email, or reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="custom-table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Administrator</th>
              <th>Action</th>
              <th>Target</th>
              <th>Change Summary</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Loading audit trail...
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                  No audit log entries matching your search.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#FFFFFF', fontSize: '0.85rem' }}>
                      {log.admin_email || log.admin_id?.slice(0, 8) || 'System / Bootstrap'}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--cyan-400)' }}>
                    {log.target_type}
                    {log.target_id && `:${log.target_id.slice(0, 8)}`}
                  </td>
                  <td style={{ fontSize: '0.85rem', maxWidth: '300px' }}>
                    {log.change_summary}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: log.reason ? 'normal' : 'italic' }}>
                    {log.reason || 'No reason provided'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
