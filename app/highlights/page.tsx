'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Edit2, Check, X } from 'lucide-react';

interface Highlight {
  id: string;
  user_id: string;
  type: 'paper' | 'policy' | 'media' | 'award';
  title: string;
  description: string;
  link: string | null;
  date: string;
  approved: boolean;
  member_name?: string;
}

interface UserProfile {
  id: string;
  name?: string;
}

type FilterType = 'all' | 'papers' | 'policy' | 'media' | 'awards' | 'pending';

const typeColorMap: Record<string, string> = {
  paper: '#2D8653',
  policy: '#1B365D',
  media: '#8B5CF6',
  award: '#E8A020',
};

const typeLabels: Record<string, string> = {
  paper: 'Paper',
  policy: 'Policy',
  media: 'Media',
  award: 'Award',
};

export default function HighlightsPage() {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    type: 'paper',
    title: '',
    description: '',
    link: '',
    date: new Date().toISOString().split('T')[0],
  });

  const isAdmin = ['super_admin', 'co_admin'].includes(userRole ?? '');
  const isMember = ['super_admin', 'co_admin', 'poster', 'member'].includes(userRole ?? '');

  // Initialize auth and fetch data
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
          .select('role')
          .eq('id', data.session.user.id)
          .single();

        if (profileData) {
          setUserRole(profileData.role);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      }
    };

    initializeAuth();
  }, []);

  // Fetch highlights
  useEffect(() => {
    const fetchHighlights = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('member_highlights')
          .select('*')
          .order('date', { ascending: false });

        if (error) throw error;

        // Fetch user profiles for member names
        if (data && data.length > 0) {
          const userIds = [...new Set(data.map((h) => h.user_id))];
          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('id, name')
            .in('id', userIds);

          const profileMap: Record<string, UserProfile> = {};
          if (profiles) {
            profiles.forEach((p) => {
              profileMap[p.id] = p;
            });
          }
          setUserProfiles(profileMap);
        }

        setHighlights(data || []);
      } catch (error) {
        console.error('Error fetching highlights:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHighlights();
  }, []);

  // Get member name
  const getMemberName = (userId: string): string => {
    return userProfiles[userId]?.name || 'Anonymous';
  };

  // Filter highlights
  const filteredHighlights = highlights.filter((h) => {
    if (filter === 'pending') {
      return isAdmin && !h.approved;
    }
    if (filter === 'all') {
      return isAdmin ? true : h.approved;
    }
    const typeKey = filter.slice(0, -1); // Remove 's' from plural
    return (isAdmin ? true : h.approved) && h.type === typeKey;
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !isMember) return;

    try {
      if (editingId && isAdmin) {
        // Admin edit
        const { error } = await supabase
          .from('member_highlights')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;
        setEditingId(null);
      } else {
        // Member submit
        const { error } = await supabase.from('member_highlights').insert({
          ...formData,
          user_id: userId,
          approved: false,
        });

        if (error) throw error;
      }

      setSuccessMessage(
        editingId
          ? 'Highlight updated successfully.'
          : 'Your highlight has been submitted for review.'
      );
      setFormData({
        type: 'paper',
        title: '',
        description: '',
        link: '',
        date: new Date().toISOString().split('T')[0],
      });
      setIsFormOpen(false);
      setEditingId(null);

      // Refresh highlights
      const { data } = await supabase
        .from('member_highlights')
        .select('*')
        .order('date', { ascending: false });
      setHighlights(data || []);

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error submitting highlight:', error);
    }
  };

  // Handle delete
  const handleDelete = async (id: string, userIdToDelete: string) => {
    if (!isAdmin && userId !== userIdToDelete) return;

    try {
      const { error } = await supabase
        .from('member_highlights')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setHighlights(highlights.filter((h) => h.id !== id));
    } catch (error) {
      console.error('Error deleting highlight:', error);
    }
  };

  // Handle edit
  const handleEdit = (highlight: Highlight) => {
    if (!isAdmin && userId !== highlight.user_id) return;

    setFormData({
      type: highlight.type,
      title: highlight.title,
      description: highlight.description,
      link: highlight.link || '',
      date: highlight.date,
    });
    setEditingId(highlight.id);
    setIsFormOpen(true);
  };

  // Handle approve
  const handleApprove = async (id: string) => {
    if (!isAdmin) return;

    try {
      const { error } = await supabase
        .from('member_highlights')
        .update({ approved: true })
        .eq('id', id);

      if (error) throw error;

      setHighlights(
        highlights.map((h) => (h.id === id ? { ...h, approved: true } : h))
      );
    } catch (error) {
      console.error('Error approving highlight:', error);
    }
  };

  // Handle reject
  const handleReject = async (id: string) => {
    if (!isAdmin) return;

    try {
      await handleDelete(id, '');
    } catch (error) {
      console.error('Error rejecting highlight:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mt-8 mb-8">
        <p>Loading highlights...</p>
      </div>
    );
  }

  return (
    <div className="container mt-8 mb-8">
      <h1 className="section-title">Member Highlights</h1>

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

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {[
          { key: 'all' as FilterType, label: 'All' },
          { key: 'papers' as FilterType, label: 'Papers' },
          { key: 'policy' as FilterType, label: 'Policy' },
          { key: 'media' as FilterType, label: 'Media' },
          { key: 'awards' as FilterType, label: 'Awards' },
          ...(isAdmin ? [{ key: 'pending' as FilterType, label: 'Pending' }] : []),
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={filter === tab.key ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Add Highlight button */}
      {isMember && !isFormOpen && (
        <button onClick={() => setIsFormOpen(true)} className="btn btn-primary mb-6">
          Add Highlight
        </button>
      )}

      {/* Form */}
      {isFormOpen && (
        <div className="card mb-6">
          <h3 style={{ color: 'var(--text-heading)', marginBottom: '1rem' }}>
            {editingId ? 'Edit Highlight' : 'Submit a Highlight'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="type">Type</label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as typeof formData.type })
                }
              >
                <option value="paper">Paper</option>
                <option value="policy">Policy</option>
                <option value="media">Media</option>
                <option value="award">Award</option>
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="title">Title</label>
              <input
                id="title"
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="link">Link (optional)</label>
              <input
                id="link"
                type="url"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="date">Date</label>
              <input
                id="date"
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary">
                {editingId ? 'Update' : 'Submit'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingId(null);
                  setFormData({
                    type: 'paper',
                    title: '',
                    description: '',
                    link: '',
                    date: new Date().toISOString().split('T')[0],
                  });
                }}
                className="btn btn-outline"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Highlights Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {filteredHighlights.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
            No highlights found.
          </p>
        ) : (
          filteredHighlights.map((highlight) => (
            <div key={highlight.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                <span
                  className="tag"
                  style={{
                    backgroundColor: `${typeColorMap[highlight.type]}20`,
                    color: typeColorMap[highlight.type],
                  }}
                >
                  {typeLabels[highlight.type]}
                </span>
                {filter === 'pending' && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleApprove(highlight.id)}
                      className="btn btn-primary btn-sm"
                      title="Approve"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => handleReject(highlight.id)}
                      className="btn btn-danger btn-sm"
                      title="Reject"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              <h3 className="card-heading">{highlight.title}</h3>
              <p className="card-text">{highlight.description}</p>

              <div style={{ marginBottom: '0.75rem' }}>
                <small style={{ color: 'var(--text-muted)' }}>
                  By {getMemberName(highlight.user_id)} • {new Date(highlight.date).toLocaleDateString()}
                </small>
              </div>

              <div className="card-footer">
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {highlight.link && (
                    <a href={highlight.link} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                      View
                    </a>
                  )}
                </div>

                {(isAdmin || userId === highlight.user_id) && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleEdit(highlight)}
                      className="btn btn-outline btn-sm"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(highlight.id, highlight.user_id)}
                      className="btn btn-danger btn-sm"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
