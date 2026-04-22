'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  id: string;
  display_name: string;
  affiliation: string;
  position: string | null;
  research_interests: string[] | null;
  bio: string | null;
  website: string | null;
  show_in_directory: boolean;
  role: string;
}

interface Stats {
  totalMembers: number;
  pendingApplications: number;
}

export default function MembersPage() {
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<Stats>({ totalMembers: 0, pendingApplications: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [affiliationFilter, setAffiliationFilter] = useState('all');
  const [affiliations, setAffiliations] = useState<string[]>([]);

  // Expanded bios state
  const [expandedBios, setExpandedBios] = useState<Set<string>>(new Set());

  // Modal state for editing role
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<UserProfile | null>(null);
  const [newRole, setNewRole] = useState('');

  // Check current user and load data
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
        if (['super_admin', 'co_admin'].includes(profile?.role ?? '')) {
          setIsAdmin(true);
        }
      }
      await loadMembers();
    };
    checkAuth();
  }, []);

  // Filter members when search or affiliation changes
  useEffect(() => {
    let filtered = members;

    // Search filter
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter((member) => {
        const name = (member.display_name || '').toLowerCase();
        const affiliation = (member.affiliation || '').toLowerCase();
        const interests = (member.research_interests || [])
          .join(', ')
          .toLowerCase();
        return (
          name.includes(lowerSearch) ||
          affiliation.includes(lowerSearch) ||
          interests.includes(lowerSearch)
        );
      });
    }

    // Affiliation filter
    if (affiliationFilter !== 'all') {
      filtered = filtered.filter(
        (member) => member.affiliation === affiliationFilter
      );
    }

    setFilteredMembers(filtered);
  }, [searchTerm, affiliationFilter, members]);

  const loadMembers = async () => {
    setLoading(true);
    setError('');
    try {
      // Load approved members
      const { data: memberData, error: memberError } = await supabase
        .from('user_profiles')
        .select('*')
        .in('role', ['member', 'poster', 'co_admin', 'super_admin'])
        .eq('show_in_directory', true)
        .order('display_name', { ascending: true });

      if (memberError) {
        setError('Failed to load members');
        setLoading(false);
        return;
      }

      setMembers(memberData || []);
      setFilteredMembers(memberData || []);

      // Extract unique affiliations
      const uniqueAffiliations = Array.from(
        new Set(
          (memberData || [])
            .map((m) => m.affiliation)
            .filter((a) => a && a.length > 0)
        )
      ).sort() as string[];
      setAffiliations(uniqueAffiliations);

      // Load stats
      const { count: totalMembers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .in('role', ['member', 'poster', 'co_admin', 'super_admin']);

      const { count: pendingCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'pending');

      setStats({
        totalMembers: totalMembers || 0,
        pendingApplications: pendingCount || 0,
      });
    } catch (err) {
      setError('An error occurred while loading members');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleBioExpanded = (memberId: string) => {
    const newExpanded = new Set(expandedBios);
    if (newExpanded.has(memberId)) {
      newExpanded.delete(memberId);
    } else {
      newExpanded.add(memberId);
    }
    setExpandedBios(newExpanded);
  };

  const handleEditRole = (member: UserProfile) => {
    setSelectedMember(member);
    setNewRole(member.role);
    setModalOpen(true);
  };

  const handleSaveRole = async () => {
    if (!selectedMember) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('id', selectedMember.id);

      if (error) {
        setError('Failed to update role');
        return;
      }

      await loadMembers();
      setModalOpen(false);
      setSelectedMember(null);
    } catch (err) {
      setError('An error occurred while updating role');
      console.error(err);
    }
  };

  const handleRemoveFromDirectory = async (memberId: string) => {
    if (!confirm('Remove this member from the directory?')) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ show_in_directory: false })
        .eq('id', memberId);

      if (error) {
        setError('Failed to remove member');
        return;
      }

      await loadMembers();
    } catch (err) {
      setError('An error occurred while removing member');
      console.error(err);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      {/* Stats Section */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <div className="card" style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: '2.5rem',
              fontWeight: 700,
              color: 'var(--accent)',
              marginBottom: '0.5rem',
            }}
          >
            {stats.totalMembers}
          </div>
          <div
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            Total Members
          </div>
        </div>
        {isAdmin && (
          <div className="card" style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '2.5rem',
                fontWeight: 700,
                color: 'var(--secondary)',
                marginBottom: '0.5rem',
              }}
            >
              {stats.pendingApplications}
            </div>
            <div
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              Pending Applications
            </div>
          </div>
        )}
      </div>

      {/* Search and Filter Bar */}
      <div
        className="card"
        style={{
          marginBottom: '2rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
        }}
      >
        <div>
          <label
            htmlFor="search"
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'var(--text-heading)',
              fontWeight: 500,
              fontSize: '0.875rem',
            }}
          >
            Search
          </label>
          <input
            id="search"
            type="text"
            value={searchTerm}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setSearchTerm(e.target.value)
            }
            placeholder="Search by name, affiliation, or interests..."
            className="input"
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label
            htmlFor="affiliation"
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'var(--text-heading)',
              fontWeight: 500,
              fontSize: '0.875rem',
            }}
          >
            Filter by Affiliation
          </label>
          <select
            id="affiliation"
            value={affiliationFilter}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setAffiliationFilter(e.target.value)
            }
            className="input"
            style={{ width: '100%' }}
          >
            <option value="all">All Affiliations</option>
            {affiliations.map((aff) => (
              <option key={aff} value={aff}>
                {aff}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: 'var(--error)',
            color: 'white',
            padding: '1rem',
            borderRadius: '0.375rem',
            marginBottom: '1.5rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Members Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Loading members...</p>
        </div>
      ) : filteredMembers.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {filteredMembers.map((member) => {
            const isBioExpanded = expandedBios.has(member.id);
            const bioPreview = member.bio
              ? member.bio.substring(0, 150)
              : '';
            const shouldShowExpandButton =
              member.bio && member.bio.length > 150;

            return (
              <div key={member.id} className="card">
                {/* Member Name */}
                <h3
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: 'var(--text-heading)',
                    marginBottom: '0.5rem',
                  }}
                >
                  {member.display_name}
                </h3>

                {/* Position and Affiliation */}
                {(member.position || member.affiliation) && (
                  <div style={{ marginBottom: '1rem' }}>
                    {member.position && (
                      <div
                        style={{
                          fontSize: '0.875rem',
                          color: 'var(--text-body)',
                          fontWeight: 500,
                        }}
                      >
                        {member.position}
                      </div>
                    )}
                    {member.affiliation && (
                      <div
                        style={{
                          fontSize: '0.875rem',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {member.affiliation}
                      </div>
                    )}
                  </div>
                )}

                {/* Research Interests Tags */}
                {member.research_interests &&
                  member.research_interests.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '0.5rem',
                        }}
                      >
                        {member.research_interests.map((interest, idx) => (
                          <span
                            key={idx}
                            className="tag"
                            style={{
                              backgroundColor: 'var(--accent-bg)',
                              color: 'var(--accent)',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '0.25rem',
                              fontSize: '0.75rem',
                              fontWeight: 500,
                            }}
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Bio */}
                {member.bio && (
                  <div style={{ marginBottom: '1rem' }}>
                    <p
                      style={{
                        fontSize: '0.875rem',
                        color: 'var(--text-body)',
                        margin: 0,
                        lineHeight: 1.5,
                      }}
                    >
                      {isBioExpanded ? member.bio : bioPreview}
                      {!isBioExpanded && member.bio.length > 150 && '...'}
                    </p>
                    {shouldShowExpandButton && (
                      <button
                        onClick={() => toggleBioExpanded(member.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--accent)',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          marginTop: '0.5rem',
                          padding: 0,
                        }}
                      >
                        {isBioExpanded ? 'Show less' : 'Show more'}
                      </button>
                    )}
                  </div>
                )}

                {/* Website Link */}
                {member.website && (
                  <div style={{ marginBottom: '1rem' }}>
                    <a
                      href={member.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '0.875rem',
                        color: 'var(--accent)',
                        textDecoration: 'none',
                        wordBreak: 'break-all',
                      }}
                    >
                      {member.website}
                    </a>
                  </div>
                )}

                {/* Admin Controls */}
                {isAdmin && (
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.5rem',
                      marginTop: '1.5rem',
                      paddingTop: '1rem',
                      borderTop: '1px solid var(--border)',
                    }}
                  >
                    <button
                      onClick={() => handleEditRole(member)}
                      className="btn btn-outline"
                      style={{ flex: 1, fontSize: '0.75rem', padding: '0.5rem' }}
                    >
                      Edit Role
                    </button>
                    <button
                      onClick={() => handleRemoveFromDirectory(member.id)}
                      className="btn btn-danger"
                      style={{ flex: 1, fontSize: '0.75rem', padding: '0.5rem' }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '3rem 1rem',
          }}
        >
          <p style={{ color: 'var(--text-muted)' }}>
            {searchTerm || affiliationFilter !== 'all'
              ? 'No members match your search criteria.'
              : 'No members in the directory yet.'}
          </p>
        </div>
      )}

      {/* Edit Role Modal */}
      {modalOpen && selectedMember && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setModalOpen(false)}
        >
          <div
            className="card"
            style={{ maxWidth: '400px', width: '90%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="section-title">Edit Member Role</h2>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-body)' }}>
              {selectedMember.display_name}
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="role"
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: 'var(--text-heading)',
                  fontWeight: 500,
                }}
              >
                Role
              </label>
              <select
                id="role"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="input"
                style={{ width: '100%' }}
              >
                <option value="member">Member</option>
                <option value="poster">Poster</option>
                <option value="co_admin">Co-Admin</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '1rem',
              }}
            >
              <button
                onClick={handleSaveRole}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                Save
              </button>
              <button
                onClick={() => setModalOpen(false)}
                className="btn btn-outline"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
