'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Menu, X, LogIn, LogOut } from 'lucide-react';

export function NavBar() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<{ email?: string; role?: string } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        const uid = data.session.user.id;
        supabase.from('user_profiles').select('role').eq('id', uid).single()
          .then(({ data: p }) => {
            setUser({ email: data.session!.user.email, role: p?.role ?? 'member' });
          });
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        const uid = session.user.id;
        supabase.from('user_profiles').select('role').eq('id', uid).single()
          .then(({ data: p }) => {
            setUser({ email: session.user.email, role: p?.role ?? 'member' });
          });
      } else {
        setUser(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
  };

  const links = [
    { href: '/about', label: 'About' },
    { href: '/seminars', label: 'Seminars' },
    { href: '/members', label: 'Members' },
    { href: '/highlights', label: 'Highlights' },
    { href: '/noticeboard', label: 'Noticeboard' },
    { href: '/resources', label: 'Resources' },
    { href: '/feedback', label: 'Feedback' },
  ];

  return (
    <nav style={{ background: 'var(--secondary)', color: '#fff', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '3.5rem' }}>
        <Link href="/" style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ background: 'var(--accent)', borderRadius: '6px', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 800 }}>HEA</span>
          <span className="hidden sm:inline">Health Equity Australia</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex" style={{ gap: '1.25rem', alignItems: 'center', fontSize: '0.875rem' }}>
          {links.map(l => (
            <Link key={l.href} href={l.href} style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.85)')}>
              {l.label}
            </Link>
          ))}
          {user ? (
            <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <LogOut size={14} /> Sign Out
            </button>
          ) : (
            <Link href="/login" style={{ background: 'var(--accent)', color: '#fff', borderRadius: '6px', padding: '4px 14px', textDecoration: 'none', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <LogIn size={14} /> Sign In
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden" style={{ background: 'var(--secondary)', borderTop: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem 0' }}>
          <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {links.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none', padding: '0.5rem 0', fontSize: '0.9rem' }}>
                {l.label}
              </Link>
            ))}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '0.25rem', paddingTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
              {user ? (
                <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem' }}>
                  Sign Out
                </button>
              ) : (
                <Link href="/login" onClick={() => setMenuOpen(false)} style={{ background: 'var(--accent)', color: '#fff', borderRadius: '6px', padding: '6px 14px', textDecoration: 'none', fontSize: '0.8rem' }}>
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
