'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trash2, Edit2, Plus, Loader, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface CommitteeMember {
  id: string;
  name: string;
  role: string;
  affiliation: string;
  bio: string;
  photo_url: string | null;
}

interface FormData {
  name: string;
  role: string;
  affiliation: string;
  bio: string;
  photo_url: string;
}

export default function About() {
  const [members, setMembers] = useState<CommitteeMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    role: '',
    affiliation: '',
    bio: '',
    photo_url: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Check admin status
  useEffect(() => {
    const checkAdmin = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', data.session.user.id)
        .single();

      if (['super_admin', 'co_admin'].includes(profile?.role ?? '')) setIsAdmin(true);
    };

    checkAdmin();
  }, []);

  // Fetch committee members
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const { data } = await supabase
          .from('committee_members')
          .select('*')
          .order('role', { ascending: true });

        setMembers(data || []);
      } catch (error) {
        console.error('Error fetching committee members:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingId) {
        // Update existing member
        await supabase
          .from('committee_members')
          .update({
            name: formData.name,
            role: formData.role,
            affiliation: formData.affiliation,
            bio: formData.bio,
            photo_url: formData.photo_url || null,
          })
          .eq('id', editingId);

        setMembers(
          members.map((m) =>
            m.id === editingId
              ? { ...m, ...formData, photo_url: formData.photo_url || null }
              : m
          )
        );
        setEditingId(null);
      } else {
        // Insert new member
        const { data: newMember } = await supabase
          .from('committee_members')
          .insert([
            {
              name: formData.name,
              role: formData.role,
              affiliation: formData.affiliation,
              bio: formData.bio,
              photo_url: formData.photo_url || null,
            },
          ])
          .select()
          .single();

        if (newMember) {
          setMembers([...members, newMember]);
        }
      }

      // Reset form
      setFormData({
        name: '',
        role: '',
        affiliation: '',
        bio: '',
        photo_url: '',
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error saving member:', error);
      alert('Failed to save member. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditMember = (member: CommitteeMember) => {
    setFormData({
      name: member.name,
      role: member.role,
      affiliation: member.affiliation,
      bio: member.bio,
      photo_url: member.photo_url || '',
    });
    setEditingId(member.id);
    setShowAddForm(true);
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm('Are you sure you want to delete this member?')) return;

    try {
      await supabase.from('committee_members').delete().eq('id', id);
      setMembers(members.filter((m) => m.id !== id));
    } catch (error) {
      console.error('Error deleting member:', error);
      alert('Failed to delete member.');
    }
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingId(null);
    setFormData({
      name: '',
      role: '',
      affiliation: '',
      bio: '',
      photo_url: '',
    });
  };

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="bg-secondary text-white py-16 md:py-24">
        <div className="container">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About the SIG</h1>
          <p className="text-xl max-w-2xl">
            Health Equity Australia is a Special Interest Group of the Australian Health Economics
            Society dedicated to advancing health equity research, policy, and practice.
          </p>
        </div>
      </section>

      {/* Convenors Section */}
      <section className="py-16 md:py-24" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <h2 className="section-title">SIG Convenors</h2>
          <div className="grid md:grid-cols-3 gap-8 mt-8">

            {/* Anita Lal */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <img
                src="https://ahes.org.au/wp-content/uploads/2022/10/anita-2.jpg"
                alt="Dr Anita Lal"
                style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '0.5rem' }}
              />
              <div>
                <h3 style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--text-heading)', marginBottom: '0.25rem' }}>Dr Anita Lal</h3>
                <p style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem' }}>Co-Convenor</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>Deakin Health Economics, Deakin University</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-body)', lineHeight: 1.6 }}>
                  Dr Anita Lal is a Victorian Cancer Agency Early Career Research fellow at Deakin Health Economics, Deakin University. Her PhD, awarded in 2018, examined ways of incorporating equity into cost-effectiveness analysis for obesity prevention policies. Her current research focuses on health-related policies and programs to reduce inequities in healthcare utilisation and the distribution of cancers. Her fellowship, funded by the Victorian Government, is focused on the impacts and cost-effectiveness of targeted programs to increase bowel, breast and cervical cancer screening in under screened culturally and linguistically diverse groups in Victoria. She is a member of the Victorian Comprehensive Cancer Centre Alliance Equity Advisory Group.
                </p>
              </div>
            </div>

            {/* Dennis Petrie */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <img
                src="https://ahes.org.au/wp-content/uploads/2026/01/Dennis-Petrie.jpg"
                alt="Professor Dennis Petrie"
                style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '0.5rem' }}
              />
              <div>
                <h3 style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--text-heading)', marginBottom: '0.25rem' }}>Professor Dennis Petrie</h3>
                <p style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem' }}>Co-Convenor</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>Centre for Health Economics, Monash University</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-body)', lineHeight: 1.6 }}>
                  Dennis Petrie is a Professor in the Centre for Health Economics, Monash University. He has published extensively on the economics of illicit drugs, smoking, alcohol, disability, cancer, the longitudinal measurement and evaluation of health inequalities and has led a large number of economic evaluations of healthcare interventions including alongside RCTs. He specialises in analysing large and complex data sets to improve health policy decisions with a focus on reducing health inequities.
                </p>
              </div>
            </div>

            {/* Shan Jiang */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <img
                src="https://ahes.org.au/wp-content/uploads/2026/01/shan-jiang_2024.jpg"
                alt="Dr Shan Jiang"
                style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '0.5rem' }}
              />
              <div>
                <h3 style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--text-heading)', marginBottom: '0.25rem' }}>Dr Shan Jiang</h3>
                <p style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem' }}>Co-Convenor</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>MUCHE, Macquarie University</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-body)', lineHeight: 1.6 }}>
                  Dr Shan Jiang is a health economist at MUCHE (Macquarie University Centre for the Health Economy), based in Sydney, Australia. Research focuses on equity-informative economic evaluation, especially distributional cost-effectiveness analysis (DCEA), economic evaluation methodology, and advanced economic evaluation modelling. With 50+ peer-reviewed publications in journals such as JAMA Network Open, Genetics in Medicine, BMJ Global Health, Value in Health, and PharmacoEconomics. One publication was selected as Value in Health Paper of the Year Award (2025). Brocher Foundation Visiting Research Fellow and Adjunct Research Fellow at the Shanghai Health Development Research Center.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

            {/* About the SIG Section */}
      <section className="py-16 md:py-24 bg-white dark:bg-primary">
        <div className="container max-w-3xl">
          <h2 className="section-title">Our Vision</h2>
          <p className="mb-6">
            Health Equity Australia connects researchers, policymakers, and practitioners across
            Australia who are committed to understanding and addressing health disparities. We
            operate as a Special Interest Group within the Australian Health Economics Society
            (AHES), leveraging the society's networks while maintaining our distinct focus on
            health equity.
          </p>
          <p className="mb-6">
            Our mission is to foster collaborative research, translate evidence into policy, and
            build a community of practice that works toward equitable health outcomes for all
            Australians, with particular attention to the needs of disadvantaged and vulnerable
            populations.
          </p>
          <p>
            Through seminars, resources, and member engagement, we create spaces for knowledge
            exchange, evidence synthesis, and collaborative problem-solving on health equity issues.
          </p>
        </div>
      </section>

      {/* Committee Members Section */}
      <section className="py-16 md:py-24 bg-secondary bg-opacity-5">
        <div className="container">
          <div className="flex items-center justify-between mb-12">
            <h2 className="section-title mb-0">Committee Members</h2>
            {isAdmin && (
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="btn btn-primary btn-sm"
              >
                <Plus className="w-4 h-4" />
                Add Member
              </button>
            )}
          </div>

          {/* Add/Edit Member Form */}
          {showAddForm && isAdmin && (
            <div className="card mb-12 bg-white dark:bg-secondary border-accent border-2">
              <form onSubmit={handleAddMember}>
                <h3 className="card-heading mb-6">
                  {editingId ? 'Edit Committee Member' : 'Add Committee Member'}
                </h3>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block font-semibold mb-2">Name</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-2">Role</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g., Co-Chair, Secretary"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-2">Affiliation</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Institution/Organization"
                      value={formData.affiliation}
                      onChange={(e) => setFormData({ ...formData, affiliation: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-2">Photo URL (Optional)</label>
                    <input
                      type="url"
                      className="input"
                      placeholder="https://example.com/photo.jpg"
                      value={formData.photo_url}
                      onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block font-semibold mb-2">Bio</label>
                  <textarea
                    className="input"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    required
                  />
                </div>

                <div className="flex gap-4">
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Member'
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleCancelForm}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Members Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader className="w-8 h-8 text-accent animate-spin" />
            </div>
          ) : members.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {members.map((member) => (
                <div key={member.id} className="card group relative">
                  {/* Admin Controls */}
                  {isAdmin && (
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <button
                        onClick={() => handleEditMember(member)}
                        className="p-2 bg-accent text-white rounded hover:bg-accent-hover transition"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMember(member.id)}
                        className="p-2 bg-error text-white rounded hover:bg-red-700 transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Photo */}
                  {member.photo_url ? (
                    <img
                      src={member.photo_url}
                      alt={member.name}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  ) : (
                    <div className="w-full h-48 bg-secondary rounded-lg mb-4 flex items-center justify-center">
                      <span className="text-6xl text-muted">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/* Content */}
                  <h3 className="card-heading">{member.name}</h3>
                  <p className="text-accent font-semibold mb-1">{member.role}</p>
                  <p className="text-muted text-sm mb-3">{member.affiliation}</p>
                  <p className="card-text text-sm">{member.bio}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted">No committee members yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* What We Do Section */}
      <section className="py-16 md:py-24 bg-white dark:bg-primary">
        <div className="container max-w-3xl">
          <h2 className="section-title">What We Do</h2>

          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold mb-3">Seminars & Workshops</h3>
              <p className="text-body mb-3">
                We host regular seminars featuring leading researchers and policymakers presenting
                cutting-edge work on health equity. These events bring together diverse
                perspectives and foster discussion on critical issues.
              </p>
              <Link href="/seminars" className="text-accent font-semibold hover:underline">
                View Upcoming Seminars →
              </Link>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3">Resources & Evidence Synthesis</h3>
              <p className="text-body mb-3">
                We curate and share resources including research summaries, policy briefs, and
                toolkits designed to support health equity research and implementation.
              </p>
              <Link href="/resources" className="text-accent font-semibold hover:underline">
                Explore Resources →
              </Link>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3">Member Highlights</h3>
              <p className="text-body mb-3">
                We celebrate the work of our members through publications, research updates, and
                professional announcements. This is your space to share accomplishments and
                engage the community.
              </p>
              <Link href="/highlights" className="text-accent font-semibold hover:underline">
                View Member Highlights →
              </Link>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3">Community Building</h3>
              <p className="text-body">
                Beyond formal activities, we facilitate networking and collaboration among
                researchers, practitioners, and policymakers working on health equity across
                Australia.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 md:py-24 bg-secondary bg-opacity-5">
        <div className="container max-w-2xl text-center">
          <h2 className="section-title">Get In Touch</h2>
          <p className="text-lg mb-8">
            Have feedback, suggestions, or want to get more involved? We'd love to hear from you.
          </p>
          <Link href="/feedback" className="btn btn-primary btn-lg">
            <Mail className="w-5 h-5" />
            Send Feedback
          </Link>
        </div>
      </section>
    </div>
  );
}
