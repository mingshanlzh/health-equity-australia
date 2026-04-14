'use client';

import { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface RegistrationFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  affiliation: string;
  position: string;
  researchInterests: string;
  bio: string;
  showInDirectory: boolean;
}

interface PendingApplication {
  id: string;
  display_name: string;
  email: string;
  affiliation: string;
  position: string;
}

export default function RegisterPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [formData, setFormData] = useState<RegistrationFormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    affiliation: '',
    position: '',
    researchInterests: '',
    bio: '',
    showInDirectory: true,
  });

  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingApplications, setPendingApplications] = useState<
    PendingApplication[]
  >([]);
  const [loadingApplications, setLoadingApplications] = useState(false);

  // Check current user and admin status
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user);
        // Check if user is admin
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        if (profile?.role === 'admin') {
          setIsAdmin(true);
          loadPendingApplications();
        }
      }
    };
    checkAuth();
  }, []);

  const loadPendingApplications = async () => {
    setLoadingApplications(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('user_profiles')
        .select('id, display_name, email, affiliation, position')
        .eq('role', 'pending')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error loading applications:', fetchError);
        return;
      }

      setPendingApplications(data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoadingApplications(false);
    }
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checkboxElement = e.target as HTMLInputElement;
      setFormData((prev) => ({
        ...prev,
        [name]: checkboxElement.checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    setError('');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    // Validation
    if (!formData.fullName.trim()) {
      setError('Full name is required');
      setLoading(false);
      return;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      setLoading(false);
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    if (!formData.affiliation.trim()) {
      setError('Affiliation is required');
      setLoading(false);
      return;
    }

    try {
      // Sign up user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (signUpError) {
        setError(signUpError.message || 'Failed to create account');
        setLoading(false);
        return;
      }

      if (!authData.user?.id) {
        setError('Failed to create account');
        setLoading(false);
        return;
      }

      // Parse research interests
      const researchInterestsArray = formData.researchInterests
        .split(',')
        .map((interest) => interest.trim())
        .filter((interest) => interest.length > 0);

      // Insert user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          display_name: formData.fullName,
          email: formData.email,
          affiliation: formData.affiliation,
          position: formData.position || null,
          research_interests: researchInterestsArray,
          bio: formData.bio || null,
          show_in_directory: formData.showInDirectory,
          role: 'pending',
        });

      if (profileError) {
        setError(profileError.message || 'Failed to create profile');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setFormData({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        affiliation: '',
        position: '',
        researchInterests: '',
        bio: '',
        showInDirectory: true,
      });

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveApplication = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: 'member' })
        .eq('id', userId);

      if (error) {
        console.error('Error approving application:', error);
        return;
      }

      loadPendingApplications();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleRejectApplication = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: 'rejected' })
        .eq('id', userId);

      if (error) {
        console.error('Error rejecting application:', error);
        return;
      }

      loadPendingApplications();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      {/* Admin Panel - Only visible to admins */}
      {isAdmin && (
        <div
          className="card"
          style={{
            marginBottom: '3rem',
            backgroundColor: 'var(--accent-bg)',
            borderLeft: '4px solid var(--accent)',
          }}
        >
          <h2 className="section-title">Pending Applications</h2>
          {loadingApplications ? (
            <p>Loading applications...</p>
          ) : pendingApplications.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.875rem',
                }}
              >
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '0.75rem',
                        color: 'var(--text-heading)',
                        fontWeight: 600,
                      }}
                    >
                      Name
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '0.75rem',
                        color: 'var(--text-heading)',
                        fontWeight: 600,
                      }}
                    >
                      Email
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '0.75rem',
                        color: 'var(--text-heading)',
                        fontWeight: 600,
                      }}
                    >
                      Affiliation
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '0.75rem',
                        color: 'var(--text-heading)',
                        fontWeight: 600,
                      }}
                    >
                      Position
                    </th>
                    <th
                      style={{
                        textAlign: 'center',
                        padding: '0.75rem',
                        color: 'var(--text-heading)',
                        fontWeight: 600,
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pendingApplications.map((app) => (
                    <tr
                      key={app.id}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        backgroundColor: 'var(--bg-primary)',
                      }}
                    >
                      <td style={{ padding: '0.75rem' }}>{app.display_name}</td>
                      <td style={{ padding: '0.75rem', fontSize: '0.8rem' }}>
                        {app.email}
                      </td>
                      <td style={{ padding: '0.75rem' }}>{app.affiliation}</td>
                      <td style={{ padding: '0.75rem' }}>
                        {app.position || '—'}
                      </td>
                      <td
                        style={{
                          padding: '0.75rem',
                          textAlign: 'center',
                          display: 'flex',
                          gap: '0.5rem',
                          justifyContent: 'center',
                        }}
                      >
                        <button
                          onClick={() => handleApproveApplication(app.id)}
                          className="btn"
                          style={{
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.75rem',
                            backgroundColor: 'var(--accent)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                          }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectApplication(app.id)}
                          className="btn btn-danger"
                          style={{
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.75rem',
                          }}
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: 'var(--text-body)' }}>
              No pending applications at this time.
            </p>
          )}
        </div>
      )}

      {/* Registration Form */}
      <div
        style={{
          maxWidth: '700px',
          margin: '0 auto',
        }}
      >
        <div className="card">
          <h1 className="section-title">Apply to Join the SIG</h1>

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

          {success && (
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
              Your application has been submitted. An admin will review and
              approve your membership shortly.
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="fullName"
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: 'var(--text-heading)',
                  fontWeight: 500,
                }}
              >
                Full Name <span style={{ color: 'var(--error)' }}>*</span>
              </label>
              <input
                id="fullName"
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                required
                className="input"
                style={{ width: '100%' }}
              />
            </div>

            {/* Email */}
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
                Email <span style={{ color: 'var(--error)' }}>*</span>
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

            {/* Password */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="password"
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: 'var(--text-heading)',
                  fontWeight: 500,
                }}
              >
                Password (min 8 characters){' '}
                <span style={{ color: 'var(--error)' }}>*</span>
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create a strong password"
                required
                className="input"
                style={{ width: '100%' }}
              />
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="confirmPassword"
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: 'var(--text-heading)',
                  fontWeight: 500,
                }}
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Re-enter your password"
                required
                className="input"
                style={{ width: '100%' }}
              />
            </div>

            {/* Affiliation */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="affiliation"
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: 'var(--text-heading)',
                  fontWeight: 500,
                }}
              >
                Affiliation / Institution{' '}
                <span style={{ color: 'var(--error)' }}>*</span>
              </label>
              <input
                id="affiliation"
                type="text"
                name="affiliation"
                value={formData.affiliation}
                onChange={handleInputChange}
                placeholder="e.g., University of Melbourne"
                required
                className="input"
                style={{ width: '100%' }}
              />
            </div>

            {/* Position */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="position"
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: 'var(--text-heading)',
                  fontWeight: 500,
                }}
              >
                Position / Title
              </label>
              <input
                id="position"
                type="text"
                name="position"
                value={formData.position}
                onChange={handleInputChange}
                placeholder="e.g., Senior Researcher"
                className="input"
                style={{ width: '100%' }}
              />
            </div>

            {/* Research Interests */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="researchInterests"
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: 'var(--text-heading)',
                  fontWeight: 500,
                }}
              >
                Research Interests (comma-separated)
              </label>
              <input
                id="researchInterests"
                type="text"
                name="researchInterests"
                value={formData.researchInterests}
                onChange={handleInputChange}
                placeholder="e.g., health equity, disparity, indigenous health"
                className="input"
                style={{ width: '100%' }}
              />
            </div>

            {/* Bio */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="bio"
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: 'var(--text-heading)',
                  fontWeight: 500,
                }}
              >
                Brief Bio (optional)
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Tell us about yourself..."
                rows={4}
                className="input"
                style={{
                  width: '100%',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Directory Checkbox */}
            <div
              style={{
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <input
                id="showInDirectory"
                type="checkbox"
                name="showInDirectory"
                checked={formData.showInDirectory}
                onChange={handleInputChange}
                style={{ cursor: 'pointer' }}
              />
              <label
                htmlFor="showInDirectory"
                style={{
                  cursor: 'pointer',
                  color: 'var(--text-body)',
                  marginBottom: 0,
                }}
              >
                I agree to have my profile listed in the member directory
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || success}
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: '1rem' }}
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>

          <div
            style={{
              textAlign: 'center',
              paddingTop: '1.5rem',
              borderTop: '1px solid var(--border)',
            }}
          >
            <p style={{ fontSize: '0.875rem', color: 'var(--text-body)' }}>
              Already a member?{' '}
              <Link
                href="/login"
                style={{
                  color: 'var(--accent)',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
