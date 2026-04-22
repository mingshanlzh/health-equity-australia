'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Edit2, Download, Github, ExternalLink, Search } from 'lucide-react';

interface Resource {
  id: string;
  category: 'data' | 'code' | 'tools' | 'guides';
  title: string;
  description: string;
  tags: string[];
  file_url: string | null;
  github_url: string | null;
  link: string | null;
  created_at: string;
}

type FilterType = 'all' | 'data' | 'code' | 'tools' | 'guides';

const categoryColorMap: Record<string, string> = {
  data: 'green',
  code: 'blue',
  tools: 'amber',
  guides: 'secondary',
};

const categoryLabels: Record<string, string> = {
  data: 'Data',
  code: 'Code',
  tools: 'Tools',
  guides: 'Guides',
};

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    category: 'data',
    title: '',
    description: '',
    tags: '',
    file_url: '',
    github_url: '',
    link: '',
  });

  const isAdmin = ['super_admin', 'co_admin'].includes(userRole ?? '');

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

  // Fetch resources
  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('resources')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setResources(data || []);
      } catch (error) {
        console.error('Error fetching resources:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  // Filter and search resources
  const filteredResources = resources.filter((r) => {
    const matchesFilter = filter === 'all' || r.category === filter;
    const matchesSearch =
      searchQuery === '' ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesFilter && matchesSearch;
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    try {
      const resourceData = {
        ...formData,
        tags: formData.tags
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t !== ''),
        file_url: formData.file_url || null,
        github_url: formData.github_url || null,
        link: formData.link || null,
      };

      if (editingId) {
        // Edit
        const { error } = await supabase
          .from('resources')
          .update(resourceData)
          .eq('id', editingId);

        if (error) throw error;
        setEditingId(null);
      } else {
        // Create
        const { error } = await supabase.from('resources').insert(resourceData);

        if (error) throw error;
      }

      setSuccessMessage(
        editingId ? 'Resource updated successfully.' : 'Resource created successfully.'
      );
      setFormData({
        category: 'data',
        title: '',
        description: '',
        tags: '',
        file_url: '',
        github_url: '',
        link: '',
      });
      setIsFormOpen(false);
      setEditingId(null);

      // Refresh resources
      const { data } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false });
      setResources(data || []);

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error submitting resource:', error);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!isAdmin) return;

    try {
      const { error } = await supabase.from('resources').delete().eq('id', id);

      if (error) throw error;

      setResources(resources.filter((r) => r.id !== id));
    } catch (error) {
      console.error('Error deleting resource:', error);
    }
  };

  // Handle edit
  const handleEdit = (resource: Resource) => {
    if (!isAdmin) return;

    setFormData({
      category: resource.category,
      title: resource.title,
      description: resource.description,
      tags: resource.tags.join(', '),
      file_url: resource.file_url || '',
      github_url: resource.github_url || '',
      link: resource.link || '',
    });
    setEditingId(resource.id);
    setIsFormOpen(true);
  };

  if (loading) {
    return (
      <div className="container mt-8 mb-8">
        <p>Loading resources...</p>
      </div>
    );
  }

  return (
    <div className="container mt-8 mb-8">
      <h1 className="section-title">Resources & Downloads</h1>

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

      {/* Search bar */}
      <div style={{ position: 'relative', marginBottom: '2rem' }}>
        <Search
          size={20}
          style={{
            position: 'absolute',
            left: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            pointerEvents: 'none',
          }}
        />
        <input
          type="text"
          placeholder="Search by title or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ paddingLeft: '2.75rem' }}
        />
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {[
          { key: 'all' as FilterType, label: 'All' },
          { key: 'data' as FilterType, label: 'Data' },
          { key: 'code' as FilterType, label: 'Code' },
          { key: 'tools' as FilterType, label: 'Tools' },
          { key: 'guides' as FilterType, label: 'Guides' },
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

      {/* Add Resource button */}
      {isAdmin && !isFormOpen && (
        <button onClick={() => setIsFormOpen(true)} className="btn btn-primary mb-6">
          Add Resource
        </button>
      )}

      {/* Form */}
      {isFormOpen && (
        <div className="card mb-6">
          <h3 style={{ color: 'var(--text-heading)', marginBottom: '1rem' }}>
            {editingId ? 'Edit Resource' : 'Add a Resource'}
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
                <option value="data">Data</option>
                <option value="code">Code</option>
                <option value="tools">Tools</option>
                <option value="guides">Guides</option>
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
              <label htmlFor="tags">Tags (comma-separated)</label>
              <input
                id="tags"
                type="text"
                placeholder="e.g., health equity, data analysis, python"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="file_url">File URL (optional)</label>
              <input
                id="file_url"
                type="url"
                value={formData.file_url}
                onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="github_url">GitHub URL (optional)</label>
              <input
                id="github_url"
                type="url"
                value={formData.github_url}
                onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
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

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary">
                {editingId ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingId(null);
                  setFormData({
                    category: 'data',
                    title: '',
                    description: '',
                    tags: '',
                    file_url: '',
                    github_url: '',
                    link: '',
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

      {/* Resources Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {filteredResources.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
            No resources found.
          </p>
        ) : (
          filteredResources.map((resource) => (
            <div key={resource.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                <span className={`badge badge-${categoryColorMap[resource.category]}`}>
                  {categoryLabels[resource.category]}
                </span>
                {isAdmin && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleEdit(resource)}
                      className="btn btn-outline btn-sm"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(resource.id)}
                      className="btn btn-danger btn-sm"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              <h3 className="card-heading">{resource.title}</h3>
              <p className="card-text">{resource.description}</p>

              {resource.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  {resource.tags.map((tag, idx) => (
                    <span key={idx} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="card-footer">
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {resource.file_url && (
                    <a
                      href={resource.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm"
                    >
                      <Download size={16} />
                      Download
                    </a>
                  )}
                  {resource.github_url && (
                    <a
                      href={resource.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm"
                    >
                      <Github size={16} />
                      GitHub
                    </a>
                  )}
                  {resource.link && (
                    <a
                      href={resource.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm"
                    >
                      <ExternalLink size={16} />
                      View
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
