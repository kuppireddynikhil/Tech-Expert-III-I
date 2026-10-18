// TECH EXPERT 2K26 — PARTICIPANT REGISTRATION
// Sri Venkateswara College of Engineering (SVCE)

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { SectionType, AcademicYearType } from '../types';
import { 
  UserPlus, 
  Terminal, 
  CheckCircle2, 
  AlertCircle, 
  Mail, 
  Lock, 
  User, 
  IdCard, 
  GraduationCap, 
  Building2 
} from 'lucide-react';

export const Register: React.FC = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [collegeId, setCollegeId] = useState('');
  const [section, setSection] = useState<SectionType>('A');
  const [academicYear, setAcademicYear] = useState<AcademicYearType>('I');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const allowedSections: SectionType[] = ['A', 'B', 'C', 'D', 'E'];
  const allowedYears: AcademicYearType[] = ['I', 'II', 'III'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Field Validations
    if (!fullName.trim()) {
      setError('Full Name is required.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!allowedSections.includes(section)) {
      setError(`Invalid Section. Allowed sections are: ${allowedSections.join(', ')}`);
      return;
    }

    if (!allowedYears.includes(academicYear)) {
      setError(`Invalid Academic Year. Allowed years are: ${allowedYears.join(', ')}`);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await api.registerParticipant({
        fullName: fullName.trim(),
        email: email.trim(),
        collegeId: collegeId.trim() || undefined,
        section,
        academicYear,
        password
      });

      setSuccess('Registration successful! Redirecting to dashboard...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.message?.includes('User already registered') || err.message?.includes('duplicate key')) {
        setError('An account with this email address is already registered. Please sign in instead.');
      } else {
        setError(err.message || 'Registration failed. Please check your details and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-narrow">
      <div className="glass-card" style={{ padding: '2.5rem', maxWidth: '600px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--grad-primary)',
            margin: '0 auto 1rem auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-cyan)'
          }}>
            <UserPlus size={26} color="#070B14" />
          </div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Participant Registration</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Tech Expert 2K26 — Sri Venkateswara College of Engineering
          </p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CheckCircle2 size={18} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="form-group">
            <label className="form-label">
              <span>Full Name</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Ramesh Kumar"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="form-group">
            <label className="form-label">
              <span>Email Address</span>
            </label>
            <input
              type="email"
              className="form-input"
              placeholder="e.g. participant@svce.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* College Registration / Student ID */}
          <div className="form-group">
            <label className="form-label">
              <span>College ID / Student Reg Number</span>
              <span className="form-hint">Optional</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 2127220501001"
              value={collegeId}
              onChange={(e) => setCollegeId(e.target.value)}
            />
          </div>

          {/* Section & Academic Year (Side by side dropdowns strictly validated) */}
          <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
            {/* Section Selection */}
            <div>
              <label className="form-label">
                <span>Section</span>
                <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>Strict A–E</span>
              </label>
              <select
                className="form-select"
                value={section}
                onChange={(e) => setSection(e.target.value as SectionType)}
                required
              >
                {allowedSections.map((sec) => (
                  <option key={sec} value={sec}>
                    Section {sec}
                  </option>
                ))}
              </select>
            </div>

            {/* Academic Year Selection */}
            <div>
              <label className="form-label">
                <span>Academic Year</span>
                <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>Strict I–III</span>
              </label>
              <select
                className="form-select"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value as AcademicYearType)}
                required
              >
                {allowedYears.map((yr) => (
                  <option key={yr} value={yr}>
                    Year {yr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '1rem' }}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: '18px', height: '18px', border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%' }} />
                Registering Account...
              </>
            ) : (
              'Complete Registration'
            )}
          </button>
        </form>

        {/* Footer links */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Already registered?{' '}
          <Link to="/login" style={{ color: 'var(--cyan-400)', fontWeight: 600 }}>
            Sign In to Competition
          </Link>
        </div>
      </div>
    </div>
  );
};
