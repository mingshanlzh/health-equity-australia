'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Check } from 'lucide-react';

interface FeedbackMessage {
  id: string;
  name: string | null;
  email: string | null;
  category: 'suggestion' | 'content_request' | 'bug_report' | 'other';
  message: string;
  read: boolean;
  created_at: string;
}

type CategoryType = 'suggestion' | 'content_request' | 'bug_report' | 'other';

const categoryLabels: Record<CategoryType, string> = {
  suggestion: 'Suggestion',
  content_request: 'Content Request',
  bug_report: 'Bug Report',
  other: 'Other',
};

export default function FeedbackPage() {
  const [feedbackMessages, setFeedbackMessages] = useState<FeedbackMessage[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'suggestion' as CategoryType,
    message: '',
  });

  const isAdmin = ['super_admin', 'co_admin'].includes(userRole ?? '');

  // Initialize auth and prefill user data
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          setUserRole(null);
          setUserId(null);
          setLoading(false);
          return;
        }

        setUserId(data.session.user.id);

        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('role, name')
          .eq('id', data.session.user.id)
          .single();

        if (profileData) {
          setUserRole(profileData.role);
          if (profileData.name) {
            setUserName(profileData.name);
            setFormData((prev) => ({ ...prev, name: profileData.name }));
          }
        }

        // Prefill email from auth user
        if (data.session.user.email) {
          setUserEmail(data.session.user.email);
          setFormData((prev) => ({ ...prev, email: data.session.user.email ?? '' }));
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      }
    };

    initializeAuth();
  }, []);

  // Fetch feedback messages for admin
  useEffect(() => {
    const fetchFeedback = async () => {
      if (!isAdmin) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('feedback_messages')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setFeedbackMessages(data || []);
      } catch (error) {
        console.error('Error fetching feedback:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, [isAdmin]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase.from('feedback_messages').insert({
        name: formData.name || null,
        email: formData.email || null,
        category: formData.category,
        message: formData.message,
        read: false,
      });

      if (error) throw error;

      setSuccessMessage('Thank you for your feedback!');
      setSubmitted(true);
      setFormData({
        name: userName || '',
        email: userEmail || '',
        category: 'suggestion',
        message: '',
      });

      setTimeout(() => {
        setSuccessMessage('');
        setSubmitted(false);
      }, 3000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  // Handle mark as read
  const handleMarkAsRead = async (id: string, currentRead: boolean) => {
    if (!isAdmin) return;

    try {
      const { error } = await supabase
        .from('feedback_messages')
        .update({ read: !currentRead })
        .eq('id', id);

      if (error) throw error;

      setFeedbackMessages(
        feedbackMessages.map((f) =>
          f.id === id ? { ...f, read: !currentRead } : f
        )
      );
    } catch (error) {
      console.error('Error updating feedback:', error);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!isAdmin) return;

    try {
      const { error } = await supabase
        .from('feedback_messages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFeedbackMessages(feedbackMessages.filter((f) => f.id !== id));
    } catch (error) {
      console.error('Error deleting feedback:', error);
    }
  };

  return (
    <div className="container mt-8 mb-8">
      <h1 className="section-title">Feedback & Suggestions</h1>

      {successMessage && (
        <div
          style={{
            backgroundColor: 'var(--accent-bg)',
            color: 'var(--accent)',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
          }}
        >
          {successMessage}
        </div>
      )}

      {/* Feedback Form */}
      <div className="card" style={{ maxWidth: '600px', marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--text-heading)', marginBottom: '1rem' }}>
          Send us your feedback
        </h2>
        <p style={{ color: 'var(--text-body)', marginBottom: '1.5rem' }}>
          We value your input. Please share your suggestions, feature requests, or report any issues.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="name">Name (optional)</label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={userName ? undefined : 'Your name'}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="email">Email (optional)</label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder={userEmail ? undefined : 'your@email.com'}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  category: e.target.value as CategoryType,
                })
              }
            >
              <option value="suggestion">Suggestion</option>
              <option value="content_request">Content Request</option>
              <option value="bug_report">Bug Report</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="message">Message</label>
            <textarea
              id="message"
              required
              placeholder="Tell us what you think..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            />
          </div>

          <button type="submit" className="btn btn-primary">
            Send Feedback
          </button>
        </form>
      </div>

      {/* Admin Panel */}
      {isAdmin && (
        <div>
          <h2 className="section-title">Feedback Messages</h2>

          {loading ? (
            <p>Loading feedback...</p>
          ) : feedbackMessages.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No feedback messages yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {feedbackMessages.map((feedback) => (
                <div
                  key={feedback.id}
                  className="card"
                  style={{
                    borderLeft: feedback.read
                      ? 'none'
                      : `4px solid var(--accent)`,
                    opacity: feedback.read ? 0.7 : 1,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <div>
                      <span className="badge badge-blue">
                        {categoryLabels[feedback.category]}
                      </span>
                      {!feedback.read && (
                        <span
                          style={{
                            display: 'inline-block',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--accent)',
                            marginLeft: '0.5rem',
                          }}
                          title="Unread"
                        />
                      )}
                    </div>
                    <small style={{ color: 'var(--text-muted)' }}>
                      {new Date(feedback.created_at).toLocaleDateString()} at{' '}
                      {new Date(feedback.created_at).toLocaleTimeString()}
                    </small>
                  </div>

                  {feedback.name && (
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong style={{ color: 'var(--text-heading)' }}>
                        {feedback.name}
                      </strong>
                      {feedback.email && (
                        <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                          ({feedback.email})
                        </span>
                      )}
                    </div>
                  )}

                  {feedback.email && !feedback.name && (
                    <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                      {feedback.email}
                    </small>
                  )}

                  <p style={{ color: 'var(--text-body)', marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>
                    {feedback.message}
                  </p>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleMarkAsRead(feedback.id, feedback.read)}
                      className={feedback.read ? 'btn btn-outline btn-sm' : 'btn btn-primary btn-sm'}
                      title={feedback.read ? 'Mark as unread' : 'Mark as read'}
                    >
                      <Check size={16} />
                      {feedback.read ? 'Unread' : 'Read'}
                    </button>
                    <button
                      onClick={() => handleDelete(feedback.id)}
                      className="btn btn-danger btn-sm"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
