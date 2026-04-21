'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface FormData {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        setError(signInError.message || 'Failed to sign in');
        setLoading(false);
        return;
      }

      // Redirect to home page on successful login
      router.push('/');
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        resetEmail
      );

      if (resetError) {
        setError(resetError.message || 'Failed to send reset email');
        setLoading(false);
        return;
      }

      setResetSent(true);
      setResetEmail('');
      setTimeout(() => {
        setResetSent(false);
        setShowResetForm(false);
      }, 5000);
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ minHeight: 'calc(100vh - 200px)' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100%',
          padding: '2rem 1rem',
        }}
      >
        <div className="card" style={{ maxWidth: '450px', width: '100%' }}>
          <h1 className="section-title" style={{ textAlign: 'center' }}>
            Sign In
          </h1>

          {!showResetForm ? (
            <>
              {error && (
                <div
                  style={{
                    backgroundColor: 'var(--error)',
                    color: 'white',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.375rem',
                    marginBottom: '1.5rem',
                    fontSize: '0.875rem',
                  }}
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label
                    htmlFor="email"
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      color: 'var(--text-heading)',
                      fontWeight: 500,
                    }}
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your.email@example.com"
                    required
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <label
                    htmlFor="password"
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      color: 'var(--text-heading)',
                      fontWeight: 500,
                    }}
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    required
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ width: '100%', marginBottom: '1rem' }}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
              </form>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.875rem',
                  marginTop: '1.5rem',
                  paddingTop: '1.5rem',
                  borderTop: '1px solid var(--border)',
                }}
              >
                <Link
                  href="/register"
                  style={{
                    color: 'var(--accent)',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  Apply to join the SIG
                </Link>
                <button
                  type="button"
                  onClick={() => setShowResetForm(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                  }}
                >
                  Forgot password?
                </button>
              </div>
            </>
          ) : (
            <>
              {resetSent && (
                <div
                  style={{
                    backgroundColor: 'var(--accent-bg)',
                    color: 'var(--accent)',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.375rem',
                    marginBottom: '1.5rem',
                    fontSize: '0.875rem',
                  }}
                >
                  Password reset email sent! Check your inbox.
                </div>
              )}

              {error && (
                <div
                  style={{
                    backgroundColor: 'var(--error)',
                    color: 'white',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.375rem',
                    marginBottom: '1.5rem',
                    fontSize: '0.875rem',
                  }}
                >
                  {error}
                </div>
              )}

              <form onSubmit={handlePasswordReset}>
                <p style={{ marginBottom: '1rem', color: 'var(--text-body)' }}>
                  Enter your email address and we'll send you a link to reset your password.
                </p>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label
                    htmlFor="reset-email"
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      color: 'var(--text-heading)',
                      fontWeight: 500,
                    }}
                  >
                    Email Address
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    required
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ width: '100%', marginBottom: '1rem' }}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>

              <button
                type="button"
                onClick={() => {
                  setShowResetForm(false);
                  setError('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  width: '100%',
                  textAlign: 'center',
                }}
              >
                Back to Sign In
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
