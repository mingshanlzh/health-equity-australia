'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Heart,
  Users,
  BookOpen,
  ArrowRight,
  Calendar,
  Award,
  Globe,
  Loader,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Stat {
  label: string;
  count: number;
  icon: React.ReactNode;
}

interface Seminar {
  id: string;
  title: string;
  speaker: string;
  date: string;
}

interface MemberHighlight {
  id: string;
  title: string;
  type: string;
  date: string;
}

export default function Home() {
  const [stats, setStats] = useState<Stat[]>([]);
  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [highlights, setHighlights] = useState<MemberHighlight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch member count
        const { count: memberCount } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true })
          .in('role', ['member', 'admin']);

        // Fetch seminars count
        const { count: seminarCount } = await supabase
          .from('seminars')
          .select('*', { count: 'exact', head: true })
          .eq('type', 'upcoming');

        // Fetch resources count
        const { count: resourceCount } = await supabase
          .from('resources')
          .select('*', { count: 'exact', head: true });

        setStats([
          {
            label: 'Members',
            count: memberCount || 0,
            icon: <Users className="w-6 h-6" />,
          },
          {
            label: 'Seminars',
            count: seminarCount || 0,
            icon: <Calendar className="w-6 h-6" />,
          },
          {
            label: 'Resources',
            count: resourceCount || 0,
            icon: <BookOpen className="w-6 h-6" />,
          },
        ]);

        // Fetch latest 2 upcoming seminars
        const { data: seminarData } = await supabase
          .from('seminars')
          .select('id, title, speaker, date')
          .eq('type', 'upcoming')
          .order('date', { ascending: true })
          .limit(2);

        setSeminars(seminarData || []);

        // Fetch latest 3 approved member highlights
        const { data: highlightData } = await supabase
          .from('member_highlights')
          .select('id, title, type, date')
          .eq('approved', true)
          .order('date', { ascending: false })
          .limit(3);

        setHighlights(highlightData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-secondary to-secondary bg-secondary text-white py-20 md:py-32">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Health Equity Australia
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-95">
              Advancing health equity research, policy, and practice across Australia — an AHES
              Special Interest Group
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Link href="/register" className="btn btn-primary btn-lg">
                Join the SIG
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/seminars" className="btn btn-outline btn-lg text-white border-white">
                Upcoming Seminars
                <Calendar className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 md:py-24 bg-white dark:bg-primary">
        <div className="container">
          <h2 className="section-title text-center mb-12">Our Mission</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Research Card */}
            <div className="card">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-accent bg-opacity-10 p-3 rounded-lg">
                  <Globe className="w-6 h-6 text-accent" />
                </div>
              </div>
              <h3 className="card-heading">Research</h3>
              <p className="card-text">
                Fostering collaborative health equity research that generates evidence for policy
                and practice improvements across Australia.
              </p>
            </div>

            {/* Policy Card */}
            <div className="card">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-accent bg-opacity-10 p-3 rounded-lg">
                  <Award className="w-6 h-6 text-accent" />
                </div>
              </div>
              <h3 className="card-heading">Policy</h3>
              <p className="card-text">
                Translating evidence into equitable health policy that addresses disparities and
                improves outcomes for all Australians.
              </p>
            </div>

            {/* Community Card */}
            <div className="card">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-accent bg-opacity-10 p-3 rounded-lg">
                  <Heart className="w-6 h-6 text-accent" />
                </div>
              </div>
              <h3 className="card-heading">Community</h3>
              <p className="card-text">
                Building a vibrant community of practice across Australia, connecting researchers,
                policymakers, and practitioners.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 md:py-24 bg-secondary bg-opacity-5">
        <div className="container">
          <h2 className="section-title text-center mb-12">By the Numbers</h2>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader className="w-8 h-8 text-accent animate-spin" />
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {stats.map((stat, idx) => (
                <div key={idx} className="card text-center">
                  <div className="flex justify-center mb-4 text-accent">{stat.icon}</div>
                  <div className="text-4xl font-bold text-heading mb-2">{stat.count}</div>
                  <p className="text-muted">{stat.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Upcoming Seminars Preview */}
      {seminars.length > 0 && (
        <section className="py-16 md:py-24 bg-white dark:bg-primary">
          <div className="container">
            <div className="flex items-center justify-between mb-12">
              <h2 className="section-title mb-0">Upcoming Seminars</h2>
              <Link
                href="/seminars"
                className="text-accent font-semibold flex items-center gap-2 hover:underline"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {seminars.map((seminar) => (
                <Link href="/seminars" key={seminar.id}>
                  <div className="card card-interactive">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="card-heading">{seminar.title}</h3>
                        <p className="text-accent font-semibold mb-2">{seminar.speaker}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-muted">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">
                        {new Date(seminar.date).toLocaleDateString('en-AU', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Member Highlights Preview */}
      {highlights.length > 0 && (
        <section className="py-16 md:py-24 bg-secondary bg-opacity-5">
          <div className="container">
            <div className="flex items-center justify-between mb-12">
              <h2 className="section-title mb-0">Latest Member Highlights</h2>
              <Link
                href="/highlights"
                className="text-accent font-semibold flex items-center gap-2 hover:underline"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {highlights.map((highlight) => (
                <Link href="/highlights" key={highlight.id}>
                  <div className="card card-interactive">
                    <div className="mb-4">
                      <span className="badge badge-blue">{highlight.type}</span>
                    </div>
                    <h3 className="card-heading">{highlight.title}</h3>
                    <p className="text-muted text-sm">
                      {new Date(highlight.date).toLocaleDateString('en-AU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-accent text-white">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Join?</h2>
            <p className="text-lg mb-8 opacity-95">
              Become part of the Health Equity Australia community and contribute to advancing
              health equity across the nation.
            </p>
            <Link href="/register" className="btn btn-primary bg-white text-accent hover:bg-opacity-90">
              Join the SIG
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
