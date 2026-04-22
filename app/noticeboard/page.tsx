'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Edit2, Check, X, ExternalLink } from 'lucide-react';

interface Opportunity {
  id: string;
  user_id: string;
  category: 'funding' | 'job' | 'event' | 'opportunity';
  title: string;
  description: string;
  link: string | null;
  deadline: string;
  approved: boolean;
  created_at: string;
}

type FilterType = 'all' | 'funding' | 'jobs' | 'events' | 'opportunities' | 'pending';

const categoryColorMap: Record<string, string> = {
  funding: 'green',
  job: 'blue',
  event: 'amber',
  opportunity: 'secondary',
};

const categoryLabels: Record<string, string> = {
  funding: 'Funding',
  job: 'Job',
  event: 'Event',
  opportunity: 'Opportunity',
};

export default function NoticeboardPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    category: 'funding',
    title: '',
    description: '',
    link: '',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const isAdmin = ['super_admin', 'co_admin'].includes(userRole ?? '');
  const isMember = ['super_admin', 'co_admin', 'poster', 'member'].includes(userRole ?? '');

  // Initialize auth
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

  // Fetch opportunities
  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('opportunities')
          .select('*')
          .order('deadline', { ascending: true });

        if (error) throw error;
        setOpportunities(data || []);
      } catch (error) {
        console.error('Error fetching opportunities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunities();
  }, []);

  // Calculate days remaining
  const getDaysRemaining = (deadline: string): number | null => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    const diff = deadlineDate.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  // Filter and sort opportunities
  const filteredOpportunities = opportunities.filter((o) => {
    if (filter === 'pending') {
      return isAdmin && !o.approved;
    }
    if (filter === 'all') {
      return isAdmin ? true : o.approved;
    }
    const categoryKey = filter.slice(0, -1); // Remove 's' from plural
    return (isAdmin ? true : o.approved) && o.category === categoryKey;
  });

  // Separate expired and active opportunities
  const activeOpps = filteredOpportunities.filter((o) => getDaysRemaining(o.deadline)! >= 0);
  const expiredOpps = filteredOpportunities.filter((o) => getDaysRemaining(o.deadline)! < 0);
  const sortedOpportunities = [...activeOpps, ...expiredOpps];

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !isMember) return;

    try {
      if (editingId && isAdmin) {
        // Admin edit
        const { error } = await supabase
          .from('opportunities')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;
        setEditingId(null);
      } else {
        // Member submit
        const { error } = await supabase.from('opportunities').insert({
          ...formData,
          user_id: userId,
          approved: false,
        });

        if (error) throw error;
      }

      setSuccessMessage(
        editingId
          ? 'Opportunity updated successfully.'
          : 'Your opportunity has been submitted for review.'
      );
      setFormData({
        category: 'funding',
        title: '',
        description: '',
        link: '',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
      setIsFormOpen(false);
      setEditingId(null);

      // Refresh opportunities
      const { data } = await supabase
        .from('opportunities')
        .select('*')
        .order('deadline', { ascending: true });
      setOpportunities(data || []);

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error submitting opportunity:', error);
    }
  };

  // Handle delete
  const handleDelete = async (id: string, userIdToDelete: string) => {
    if (!isAdmin && userId !== userIdToDelete) return;

    try {
      const { error } = await supabase.from('opportunities').delete().eq('id', id);

      if (error) throw error;

      setOpportunities(opportunities.filter((o) => o.id !== id));
    } catch (error) {
      console.error('Error deleting opportunity:', error);
    }
  };

  // Handle edit
  const handleEdit = (opportunity: Opportunity) => {
    if (!isAdmin && userId !== opportunity.user_id) return;

    setFormData({
      category: opportunity.category,
      title: opportunity.title,
      description: opportunity.description,
      link: opportunity.link || '',
      deadline: opportunity.deadline,
    });
    setEditingId(opportunity.id);
    setIsFormOpen(true);
  };

  // Handle approve
  const handleApprove = async (id: string) => {
    if (!isAdmin) return;

    try {
      const { error } = await supabase
        .from('opportunities')
        .update({ approved: true })
        .eq('id', id);

      if (error) throw error;

      setOpportunities(
        opportunities.map((o) => (o.id === id ? { ...o, approved: true } : o))
      );
    } catch (error) {
      console.error('Error approving opportunity:', error);
    }
  };

  // Handle reject
  const handleReject = async (id: string) => {
    if (!isAdmin) return;

    try {
      await handleDelete(id, '');
    } catch (error) {
      console.error('Error rejecting opportunity:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mt-8 mb-8">
        <p>Loading opportunities...</p>
      </div>
    );
  }

  return (
    <div className="container mt-8 mb-8">
      <h1 className="section-title">Noticeboard & Opportunities</h1>

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
          { key: 'funding' as FilterType, label: 'Funding' },
          { key: 'jobs' as FilterType, label: 'Jobs' },
          { key: 'events' as FilterType, label: 'Events' },
          { key: 'opportunities' as FilterType, label: 'Opportunities' },
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

      {/* Post Opportunity button */}
      {isMember && !isFormOpen && (
        <button onClick={() => setIsFormOpen(true)} className="btn btn-primary mb-6">
          Post Opportunity
        </button>
      )}

      {/* Form */}
      {isFormOpen && (
        <div className="card mb-6">
          <h3 style={{ color: 'var(--text-heading)', marginBottom: '1rem' }}>
            {editingId ? 'Edit Opportunity' : 'Post an Opportunity'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="category">Category</label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value as typeof formData.category,
                  })
                }
              >
                <option value="funding">Funding</option>
                <option value="job">Job</option>
                <option value="event">Event</option>
                <option value="opportunity">Opportunity</option>
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
              <label htmlFor="deadline">Deadline</label>
              <input
                id="deadline"
                type="date"
                required
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
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
                    category: 'funding',
                    title: '',
                    description: '',
                    link: '',
                    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                      .toISOString()
                      .split('T')[0],
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

      {/* Opportunities Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {sortedOpportunities.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
            No opportunities found.
          </p>
        ) : (
          sortedOpportunities.map((opportunity) => {
            const daysRemaining = getDaysRemaining(opportunity.deadline);
            const isExpired = daysRemaining! < 0;

            return (
              <div key={opportunity.id} className="card">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    marginBottom: '0.75rem',
                  }}
                >
                  <span className={`badge badge-${categoryColorMap[opportunity.category]}`}>
                    {categoryLabels[opportunity.category]}
                  </span>

                  {isExpired && (
                    <span
                      className="badge badge-red"
                      style={{ marginLeft: 'auto' }}
                    >
                      Expired
                    </span>
                  )}

                  {!isExpired && daysRemaining !== null && (
                    <span
                      className="badge badge-amber"
                      style={{ marginLeft: 'auto' }}
                    >
                      {daysRemaining} days left
                    </span>
                  )}

                  {filter === 'pending' && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '0.5rem' }}>
                      <button
                        onClick={() => handleApprove(opportunity.id)}
                        className="btn btn-primary btn-sm"
                        title="Approve"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => handleReject(opportunity.id)}
                        className="btn btn-danger btn-sm"
                        title="Reject"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>

                <h3 className="card-heading">{opportunity.title}</h3>
                <p className="card-text">{opportunity.description.substring(0, 100)}...</p>

                <small style={{ color: 'var(--text-muted)' }}>
                  Posted on {new Date(opportunity.created_at).toLocaleDateString()}
                </small>

                <div className="card-footer">
                  {opportunity.link && (
                    <a
                      href={opportunity.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm"
                    >
                      <ExternalLink size={16} />
                      View
                    </a>
                  )}

                  {(isAdmin || userId === opportunity.user_id) && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                      <button
                        onClick={() => handleEdit(opportunity)}
                        className="btn btn-outline btn-sm"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(opportunity.id, opportunity.user_id)}
                        className="btn btn-danger btn-sm"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
