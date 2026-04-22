'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronDown, ChevronUp, X, Trash2, Edit2, Users, Download, Video } from 'lucide-react';
import '../seminars.css';

// Types
interface Seminar {
  id: string;
  title: string;
  speaker_name: string;
  speaker_affiliation: string;
  abstract: string;
  date: string;
  location: string;
  location_link?: string;
  type: 'upcoming' | 'past';
  tags: string[];
  recording_url?: string;
  slides_url?: string;
  created_at: string;
}

interface Registration {
  id: string;
  seminar_id: string;
  name: string;
  email: string;
  affiliation: string;
  created_at: string;
}

interface FormData {
  title: string;
  speaker_name: string;
  speaker_affiliation: string;
  abstract: string;
  date: string;
  location: string;
  location_link: string;
  type: 'upcoming' | 'past';
  tags: string;
  recording_url: string;
  slides_url: string;
}

interface RegistrationFormData {
  name: string;
  email: string;
  affiliation: string;
}

interface UserProfile {
  id: string;
  role: string;
}

// Date formatting helper
function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Australia/Sydney',
  });
}

function formatDateForInput(d: string): string {
  return d.substring(0, 16);
}

export default function SeminarsPage() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedAbstracts, setExpandedAbstracts] = useState<Set<string>>(new Set());
  const [expandedRegistrations, setExpandedRegistrations] = useState<Set<string>>(new Set());
  const [registrations, setRegistrations] = useState<Record<string, Registration[]>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    speaker_name: '',
    speaker_affiliation: '',
    abstract: '',
    date: '',
    location: '',
    location_link: '',
    type: 'upcoming',
    tags: '',
    recording_url: '',
    slides_url: '',
  });

  const [registrationForm, setRegistrationForm] = useState<Record<string, RegistrationFormData>>({});

  // Initialize user and load seminars
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setUserId(session.user.id);
          setUserEmail(session.user.email || null);

          // Get user profile for role and name
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('role, full_name')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            setUserRole(profile.role);
            setUserName(profile.full_name);
          }
        }
      } catch (error) {
        console.error('Error initializing user:', error);
      }
    };

    const loadSeminars = async () => {
      try {
        const { data, error } = await supabase
          .from('seminars')
          .select('*')
          .order('date', { ascending: false });

        if (error) throw error;
        setSeminars(data || []);
      } catch (error) {
        console.error('Error loading seminars:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
    loadSeminars();
  }, []);

  const isAdmin = ['super_admin', 'co_admin'].includes(userRole ?? '');

  const filteredSeminars = seminars.filter((s) => s.type === activeTab);

  const handleAddSeminar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAdmin) return;

    try {
      const newSeminar = {
        title: formData.title,
        speaker_name: formData.speaker_name,
        speaker_affiliation: formData.speaker_affiliation,
        abstract: formData.abstract,
        date: formData.date,
        location: formData.location,
        location_link: formData.location_link || undefined,
        type: formData.type,
        tags: formData.tags.split(',').map((t) => t.trim()),
        recording_url: formData.recording_url || undefined,
        slides_url: formData.slides_url || undefined,
      };

      if (editingId) {
        // Update existing seminar
        const { error } = await supabase
          .from('seminars')
          .update(newSeminar)
          .eq('id', editingId);

        if (error) throw error;

        setSeminars((prev) =>
          prev.map((s) => (s.id === editingId ? { ...s, ...newSeminar } : s))
        );
        setEditingId(null);
        setSuccessMessage('Seminar updated successfully!');
      } else {
        // Create new seminar
        const { data, error } = await supabase
          .from('seminars')
          .insert([newSeminar])
          .select();

        if (error) throw error;

        if (data) {
          setSeminars((prev) => [data[0] as Seminar, ...prev]);
          setSuccessMessage('Seminar added successfully!');
        }
      }

      resetForm();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error saving seminar:', error);
      setSuccessMessage('Error saving seminar. Please try again.');
    }
  };

  const handleDeleteSeminar = async (id: string) => {
    if (!isAdmin || !confirm('Are you sure you want to delete this seminar?')) return;

    try {
      const { error } = await supabase.from('seminars').delete().eq('id', id);

      if (error) throw error;

      setSeminars((prev) => prev.filter((s) => s.id !== id));
      setSuccessMessage('Seminar deleted successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error deleting seminar:', error);
    }
  };

  const handleEditSeminar = (seminar: Seminar) => {
    setFormData({
      title: seminar.title,
      speaker_name: seminar.speaker_name,
      speaker_affiliation: seminar.speaker_affiliation,
      abstract: seminar.abstract,
      date: formatDateForInput(seminar.date),
      location: seminar.location,
      location_link: seminar.location_link || '',
      type: seminar.type,
      tags: seminar.tags.join(', '),
      recording_url: seminar.recording_url || '',
      slides_url: seminar.slides_url || '',
    });
    setEditingId(seminar.id);
    setShowAddForm(true);
  };

  const handleMoveSeminar = async (id: string, newType: 'upcoming' | 'past') => {
    if (!isAdmin) return;

    try {
      const { error } = await supabase.from('seminars').update({ type: newType }).eq('id', id);

      if (error) throw error;

      setSeminars((prev) =>
        prev.map((s) => (s.id === id ? { ...s, type: newType } : s))
      );
      setSuccessMessage(`Seminar moved to ${newType} seminars!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error moving seminar:', error);
    }
  };

  const handleRegister = async (e: React.FormEvent, seminarId: string) => {
    e.preventDefault();

    const data = registrationForm[seminarId];
    if (!data) return;

    try {
      const { error } = await supabase.from('seminar_registrations').insert([
        {
          seminar_id: seminarId,
          name: data.name,
          email: data.email,
          affiliation: data.affiliation,
        },
      ]);

      if (error) throw error;

      setRegistrationForm((prev) => {
        const newForm = { ...prev };
        delete newForm[seminarId];
        return newForm;
      });

      setSuccessMessage('Registration successful! Check your email for confirmation.');
      setTimeout(() => setSuccessMessage(null), 3000);

      // Reload registrations for this seminar
      loadRegistrations(seminarId);
    } catch (error) {
      console.error('Error registering:', error);
      setSuccessMessage('Error registering. Please try again.');
    }
  };

  const loadRegistrations = async (seminarId: string) => {
    try {
      const { data, error } = await supabase
        .from('seminar_registrations')
        .select('*')
        .eq('seminar_id', seminarId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRegistrations((prev) => ({
        ...prev,
        [seminarId]: data || [],
      }));
    } catch (error) {
      console.error('Error loading registrations:', error);
    }
  };

  const toggleAbstract = (id: string) => {
    setExpandedAbstracts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleRegistrations = async (id: string) => {
    setExpandedRegistrations((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
        loadRegistrations(id);
      }
      return newSet;
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      speaker_name: '',
      speaker_affiliation: '',
      abstract: '',
      date: '',
      location: '',
      location_link: '',
      type: 'upcoming',
      tags: '',
      recording_url: '',
      slides_url: '',
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  const getAbstractPreview = (abstract: string, isExpanded: boolean): string => {
    if (isExpanded) return abstract;
    const lines = abstract.split('\n');
    return lines.slice(0, 2).join('\n');
  };

  return (
    <div className="seminars-page">
      <div className="container">
        {/* Header */}
        <div className="seminars-header">
          <div>
            <h1 className="section-title">Seminars</h1>
            <p className="seminars-subtitle">
              Join us for insightful discussions on health equity. All seminars are open to the
              community.
            </p>
          </div>
          {isAdmin && (
            <button
              className="btn btn-primary"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? 'Cancel' : '+ Add Seminar'}
            </button>
          )}
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="success-message">
            {successMessage}
            <button
              className="close-btn"
              onClick={() => setSuccessMessage(null)}
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Add/Edit Form */}
        {isAdmin && showAddForm && (
          <div className="seminar-form card">
            <h2>{editingId ? 'Edit Seminar' : 'Add New Seminar'}</h2>
            <form onSubmit={handleAddSeminar}>
              <div className="form-group">
                <label htmlFor="title">Seminar Title *</label>
                <input
                  id="title"
                  type="text"
                  className="input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="e.g., Health Equity in Indigenous Communities"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="speaker_name">Speaker Name *</label>
                  <input
                    id="speaker_name"
                    type="text"
                    className="input"
                    value={formData.speaker_name}
                    onChange={(e) => setFormData({ ...formData, speaker_name: e.target.value })}
                    required
                    placeholder="e.g., Dr. Jane Smith"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="speaker_affiliation">Affiliation *</label>
                  <input
                    id="speaker_affiliation"
                    type="text"
                    className="input"
                    value={formData.speaker_affiliation}
                    onChange={(e) =>
                      setFormData({ ...formData, speaker_affiliation: e.target.value })
                    }
                    required
                    placeholder="e.g., University of Melbourne"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="abstract">Abstract *</label>
                <textarea
                  id="abstract"
                  className="input"
                  value={formData.abstract}
                  onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
                  required
                  placeholder="Enter seminar abstract..."
                  rows={6}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="date">Date & Time *</label>
                  <input
                    id="date"
                    type="datetime-local"
                    className="input"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="type">Type *</label>
                  <select
                    id="type"
                    className="input"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as 'upcoming' | 'past' })
                    }
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="past">Past</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="location">Location *</label>
                  <input
                    id="location"
                    type="text"
                    className="input"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                    placeholder="e.g., Zoom / Room 101, Building A"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="location_link">Location Link</label>
                  <input
                    id="location_link"
                    type="url"
                    className="input"
                    value={formData.location_link}
                    onChange={(e) => setFormData({ ...formData, location_link: e.target.value })}
                    placeholder="https://zoom.us/... (optional)"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="tags">Tags</label>
                <input
                  id="tags"
                  type="text"
                  className="input"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g., DCEA, Indigenous Health, Policy (comma-separated)"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="recording_url">Recording URL</label>
                  <input
                    id="recording_url"
                    type="url"
                    className="input"
                    value={formData.recording_url}
                    onChange={(e) => setFormData({ ...formData, recording_url: e.target.value })}
                    placeholder="https://youtube.com/... (optional)"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="slides_url">Slides URL</label>
                  <input
                    id="slides_url"
                    type="url"
                    className="input"
                    value={formData.slides_url}
                    onChange={(e) => setFormData({ ...formData, slides_url: e.target.value })}
                    placeholder="https://figshare.com/... (optional)"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Update Seminar' : 'Add Seminar'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="seminars-tabs">
          <button
            className={`tab-button ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming Seminars
          </button>
          <button
            className={`tab-button ${activeTab === 'past' ? 'active' : ''}`}
            onClick={() => setActiveTab('past')}
          >
            Past Seminars
          </button>
        </div>

        {/* Loading State */}
        {loading && <p className="loading-message">Loading seminars...</p>}

        {/* Seminars List */}
        {!loading && filteredSeminars.length === 0 && (
          <div className="empty-state">
            <p>
              {activeTab === 'upcoming'
                ? 'No upcoming seminars scheduled. Check back soon!'
                : 'No past seminars yet.'}
            </p>
          </div>
        )}

        {!loading && filteredSeminars.length > 0 && (
          <div className="seminars-grid">
            {filteredSeminars.map((seminar) => (
              <div key={seminar.id} className="seminar-card card">
                {/* Card Header */}
                <div className="card-header">
                  <div className="flex-1">
                    <h3 className="card-heading">{seminar.title}</h3>
                    <p className="speaker-info">
                      <strong>{seminar.speaker_name}</strong>
                      <br />
                      <span className="text-muted">{seminar.speaker_affiliation}</span>
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="card-actions">
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => handleEditSeminar(seminar)}
                        title="Edit seminar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteSeminar(seminar.id)}
                        title="Delete seminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Date & Location */}
                <div className="seminar-meta">
                  <div className="meta-item">
                    <span className="meta-label">Date:</span>
                    <span className="meta-value">{formatDate(seminar.date)}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Location:</span>
                    {seminar.location_link ? (
                      <a
                        href={seminar.location_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="meta-value link"
                      >
                        {seminar.location} ↗
                      </a>
                    ) : (
                      <span className="meta-value">{seminar.location}</span>
                    )}
                  </div>
                </div>

                {/* Tags */}
                {seminar.tags.length > 0 && (
                  <div className="seminar-tags">
                    {seminar.tags.map((tag) => (
                      <span key={tag} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Abstract */}
                <div className="seminar-abstract">
                  <div className="abstract-text">
                    {getAbstractPreview(seminar.abstract, expandedAbstracts.has(seminar.id))}
                  </div>
                  {seminar.abstract.split('\n').length > 2 && (
                    <button
                      className="btn-abstract-toggle"
                      onClick={() => toggleAbstract(seminar.id)}
                    >
                      {expandedAbstracts.has(seminar.id) ? (
                        <>
                          Show less <ChevronUp size={16} />
                        </>
                      ) : (
                        <>
                          Read more <ChevronDown size={16} />
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Upcoming: Registration Form */}
                {activeTab === 'upcoming' && (
                  <div className="seminar-registration">
                    {!registrationForm[seminar.id] ? (
                      <button
                        className="btn btn-primary btn-full"
                        onClick={() =>
                          setRegistrationForm((prev) => ({
                            ...prev,
                            [seminar.id]: {
                              name: userName || '',
                              email: userEmail || '',
                              affiliation: '',
                            },
                          }))
                        }
                      >
                        Register
                      </button>
                    ) : (
                      <form
                        onSubmit={(e) => handleRegister(e, seminar.id)}
                        className="registration-form"
                      >
                        <input
                          type="text"
                          className="input input-sm"
                          placeholder="Full Name"
                          value={registrationForm[seminar.id].name}
                          onChange={(e) =>
                            setRegistrationForm((prev) => ({
                              ...prev,
                              [seminar.id]: {
                                ...prev[seminar.id],
                                name: e.target.value,
                              },
                            }))
                          }
                          required
                        />
                        <input
                          type="email"
                          className="input input-sm"
                          placeholder="Email"
                          value={registrationForm[seminar.id].email}
                          onChange={(e) =>
                            setRegistrationForm((prev) => ({
                              ...prev,
                              [seminar.id]: {
                                ...prev[seminar.id],
                                email: e.target.value,
                              },
                            }))
                          }
                          required
                        />
                        <input
                          type="text"
                          className="input input-sm"
                          placeholder="Affiliation (University, Organisation, etc.)"
                          value={registrationForm[seminar.id].affiliation}
                          onChange={(e) =>
                            setRegistrationForm((prev) => ({
                              ...prev,
                              [seminar.id]: {
                                ...prev[seminar.id],
                                affiliation: e.target.value,
                              },
                            }))
                          }
                          required
                        />
                        <div className="registration-actions">
                          <button type="submit" className="btn btn-primary btn-sm">
                            Submit
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() =>
                              setRegistrationForm((prev) => {
                                const newForm = { ...prev };
                                delete newForm[seminar.id];
                                return newForm;
                              })
                            }
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {/* Past: Recording & Slides Links */}
                {activeTab === 'past' && (
                  <div className="seminar-resources">
                    {seminar.recording_url && (
                      <a
                        href={seminar.recording_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline btn-sm"
                      >
                        <Video size={16} /> Watch Recording
                      </a>
                    )}
                    {seminar.slides_url && (
                      <a
                        href={seminar.slides_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline btn-sm"
                      >
                        <Download size={16} /> View Slides
                      </a>
                    )}
                  </div>
                )}

                {/* Admin: Registrations & Move Button */}
                {isAdmin && activeTab === 'upcoming' && (
                  <div className="admin-actions">
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => toggleRegistrations(seminar.id)}
                    >
                      <Users size={16} /> View Registrations
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleMoveSeminar(seminar.id, 'past')}
                    >
                      Mark as Past
                    </button>
                  </div>
                )}

                {/* Registrations Panel */}
                {isAdmin && expandedRegistrations.has(seminar.id) && (
                  <div className="registrations-panel">
                    <h4>Registrations ({registrations[seminar.id]?.length || 0})</h4>
                    {registrations[seminar.id]?.length === 0 ? (
                      <p className="text-muted">No registrations yet.</p>
                    ) : (
                      <div className="registrations-list">
                        {registrations[seminar.id]?.map((reg) => (
                          <div key={reg.id} className="registration-item">
                            <div>
                              <strong>{reg.name}</strong>
                              <br />
                              <span className="text-muted">{reg.email}</span>
                              <br />
                              <span className="text-muted text-sm">{reg.affiliation}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
