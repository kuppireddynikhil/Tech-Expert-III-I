// TECH EXPERT 2K26 — PHASE ADVANCEMENT (ADMIN)
// The administrator decides how many (and which) participants move to the next phase.

import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import type { AdvancementCandidate, AdvancementTarget } from '../../types';
import { ArrowUpCircle, CheckCircle2, Search, Wand2, Send, Undo2 } from 'lucide-react';

const TABS: { id: AdvancementTarget; label: string; from: string; defaultLimit: number }[] = [
  { id: 'phase2', label: 'Phase 1 → Phase 2', from: 'Phase 1 quiz score', defaultLimit: 15 },
  { id: 'phase3', label: 'Phase 2 → Phase 3', from: 'Phase 2 debugging score', defaultLimit: 5 }
];

export const PhaseAdvancement: React.FC = () => {
  const [target, setTarget] = useState<AdvancementTarget>('phase2');
  const [candidates, setCandidates] = useState<AdvancementCandidate[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [published, setPublished] = useState(false);
  const [sourceReady, setSourceReady] = useState(true);
  const [limit, setLimit] = useState(15);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const tab = TABS.find(t => t.id === target)!;

  const load = async (t: AdvancementTarget) => {
    setLoading(true);
    setMessage('');
    try {
      const res = await api.getAdvancementCandidates(t);
      setCandidates(res.candidates);
      setPublished(res.published);
      setSourceReady(res.sourceReady);
      setSelected(new Set(res.candidates.filter(c => c.selected).map(c => c.user_id)));
      const controls = await api.getPhaseControls();
      const src = t === 'phase2' ? controls.phase1 : controls.phase2;
      setLimit(src?.qualification_limit || TABS.find(x => x.id === t)!.defaultLimit);
    } catch (err: any) {
      setMessage(`Failed to load: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(target);
  }, [target]);

  const autoSelectTop = () => {
    const n = Math.max(0, Math.floor(limit));
    setSelected(new Set(candidates.slice(0, n).map(c => c.user_id)));
  };

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePublish = async () => {
    if (selected.size === 0) {
      alert('Select at least one participant to advance.');
      return;
    }
    if (!confirm(`Advance ${selected.size} participant(s) to ${target === 'phase2' ? 'Phase 2' : 'Phase 3'}? Everyone else will be blocked from that phase.`)) return;
    setSaving(true);
    try {
      await api.publishAdvancement(target, candidates, Array.from(selected), limit);
      setMessage(`Published: ${selected.size} participant(s) can now enter ${target === 'phase2' ? 'Phase 2' : 'Phase 3'}.`);
      await load(target);
    } catch (err: any) {
      alert(`Failed to publish: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleWithdraw = async () => {
    if (!confirm('Withdraw the published list? Nobody will be able to enter the next phase until you publish again.')) return;
    setSaving(true);
    try {
      await api.clearAdvancement(target);
      setMessage('Published list withdrawn.');
      await load(target);
    } catch (err: any) {
      alert(`Failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const visible = useMemo(() => {
    const q = search.toLowerCase();
    return candidates.filter(c => c.full_name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
  }, [candidates, search]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <div className="badge badge-primary" style={{ marginBottom: '0.4rem' }}>Competition Control</div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text)' }}>Phase Advancement</h1>
        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
          Choose how many participants move on to the next phase, review the ranking, and adjust individuals before publishing.
          Participants not selected cannot enter the next phase.
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTarget(t.id)}
            className={`btn ${target === t.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <ArrowUpCircle size={16} /> {t.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: '1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Number to advance:</span>
          <input
            type="number"
            min={0}
            className="form-input"
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value || '0', 10))}
            style={{ width: '90px', padding: '0.5rem 0.75rem' }}
          />
        </div>
        <button onClick={autoSelectTop} className="btn btn-secondary btn-sm" disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <Wand2 size={16} /> Select Top {limit || 0}
        </button>

        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <Search size={16} color="var(--color-text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search participant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        <span className={`badge ${published ? 'badge-success' : 'badge-warning'}`}>
          {published ? 'PUBLISHED' : 'NOT PUBLISHED'}
        </span>
        <strong style={{ color: 'var(--color-primary)' }}>{selected.size} selected</strong>

        <button onClick={handlePublish} className="btn btn-primary btn-sm" disabled={saving || loading || !sourceReady} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <Send size={16} /> {saving ? 'Saving...' : published ? 'Update & Publish' : 'Publish'}
        </button>
        {published && (
          <button onClick={handleWithdraw} className="btn btn-danger btn-sm" disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <Undo2 size={16} /> Withdraw
          </button>
        )}
      </div>

      {message && (
        <div className="alert alert-info">
          {message}
        </div>
      )}

      {!sourceReady && (
        <div className="alert alert-warning">
          Publish the Phase 1 → Phase 2 list first. Phase 3 candidates are chosen from the participants advanced to Phase 2.
        </div>
      )}

      <div className="custom-table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>Advance</th>
              <th>Rank</th>
              <th>Participant</th>
              <th>Sec / Yr</th>
              <th>{tab.from}</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>Loading ranking...</td></tr>
            ) : visible.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>No participants to show yet.</td></tr>
            ) : (
              visible.map(c => {
                const isSel = selected.has(c.user_id);
                const cutoff = c.rank === Math.floor(limit) && limit > 0;
                return (
                  <tr
                    key={c.user_id}
                    style={{
                      backgroundColor: isSel ? '#EFF6FF' : undefined,
                      borderBottom: cutoff ? '2px dashed var(--color-warning)' : undefined
                    }}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={isSel}
                        onChange={() => toggle(c.user_id)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--color-primary)' }}
                      />
                    </td>
                    <td><strong>#{c.rank}</strong></td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{c.full_name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{c.email}</div>
                    </td>
                    <td>
                      <span className="badge badge-primary">Sec {c.section}</span>{' '}
                      <span className="badge badge-secondary">Yr {c.academic_year}</span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{c.score} pts</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      {isSel && <CheckCircle2 size={14} color="var(--color-success)" style={{ verticalAlign: 'middle', marginRight: '4px' }} />}
                      {c.detail}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
