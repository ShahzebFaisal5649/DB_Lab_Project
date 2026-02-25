import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from './ui/button';
import { ArrowRight, BookOpen, GraduationCap, MessageSquare, Star, Users, Clock, Globe, Shield, CheckCircle2, ChevronRight } from 'lucide-react';
import Login from './Login';
import Register from './Register';

interface HomeProps {
  isLoggedIn: boolean;
  userRole: string | null;
  setIsLoggedIn: (value: boolean) => void;
  setUserRole: (role: string | null) => void;
  setUserId: (id: string | null) => void;
}

const stats = [
  { value: '500+', label: 'Expert Tutors' },
  { value: '2,000+', label: 'Sessions Held' },
  { value: '50+', label: 'Subjects' },
  { value: '4.9', label: 'Avg. Rating' },
];

const features = [
  {
    icon: <Users className="w-5 h-5" />,
    title: 'Find Expert Tutors',
    description: 'Browse verified tutors across 50+ subjects. Filter by expertise, availability, and ratings.',
  },
  {
    icon: <MessageSquare className="w-5 h-5" />,
    title: 'Real-time Chat',
    description: 'Connect instantly with your tutor through our built-in live chat. No third-party tools needed.',
  },
  {
    icon: <Clock className="w-5 h-5" />,
    title: 'Flexible Scheduling',
    description: 'Book sessions that fit your schedule. Tutors set their availability so you can plan ahead.',
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'Verified Professionals',
    description: 'Every tutor is manually verified by our admin team with document review and approval.',
  },
  {
    icon: <Star className="w-5 h-5" />,
    title: 'Ratings & Feedback',
    description: 'Read honest reviews from students. Rate sessions to help the community improve.',
  },
  {
    icon: <Globe className="w-5 h-5" />,
    title: 'Learn Anywhere',
    description: 'Fully remote platform. Study from anywhere with tutors across all time zones.',
  },
];

const steps = [
  { step: '01', title: 'Create Your Account', desc: 'Sign up as a student in under 2 minutes. Set your subjects and learning goals.' },
  { step: '02', title: 'Find a Tutor', desc: 'Browse verified tutors, read reviews, and check availability that fits your schedule.' },
  { step: '03', title: 'Start Learning', desc: 'Request a session, get confirmed, and connect through real-time chat.' },
];

export function Home({ isLoggedIn, userRole, setIsLoggedIn, setUserRole, setUserId }: HomeProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(() => {
    const tab = searchParams.get('tab');
    return tab === 'register' ? 'register' : 'login';
  });
  const [showAuth, setShowAuth] = useState(() => !!searchParams.get('tab'));

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'register' || tab === 'login') {
      setActiveTab(tab);
      setShowAuth(true);
    }
  }, [searchParams]);

  if (isLoggedIn) {
    const dashboardPath = userRole === 'ADMIN' ? '/admin/dashboard' : '/dashboard';
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-sm">
          <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mx-auto">
            <GraduationCap className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="text-muted-foreground mt-1">
              Signed in as{' '}
              <span className="font-medium text-foreground">
                {userRole === 'ADMIN' ? 'Administrator' : userRole === 'TUTOR' ? 'Tutor' : 'Student'}
              </span>
            </p>
          </div>
          <Link to={dashboardPath}>
            <Button size="lg" className="gap-2">
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (showAuth) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-4">
          <div className="flex gap-1 bg-secondary rounded-lg p-1">
            <button
              onClick={() => { setActiveTab('login'); setSearchParams({ tab: 'login' }); }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${activeTab === 'login' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setActiveTab('register'); setSearchParams({ tab: 'register' }); }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${activeTab === 'register' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Create Account
            </button>
          </div>
          {activeTab === 'login' ? (
            <Login setIsLoggedIn={setIsLoggedIn} setUserRole={setUserRole} setUserId={setUserId} />
          ) : (
            <Register setIsLoggedIn={setIsLoggedIn} setUserRole={setUserRole} setUserId={setUserId} />
          )}
          <p className="text-center text-sm text-muted-foreground">
            <button onClick={() => { setShowAuth(false); setSearchParams({}); }} className="underline underline-offset-4 hover:text-foreground transition-colors">
              Back to home
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-hidden">

      {/* Hero */}
      <section className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-secondary text-muted-foreground text-xs font-medium mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
              Now with real-time chat and session tracking
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6">
              The platform that<br />connects students with<br />
              <span className="text-primary">expert tutors</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mb-10 leading-relaxed">
              EDUConnect bridges the gap between students and verified tutors. Book sessions, chat in real-time, and reach your academic goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="gap-2 h-11 px-6 text-sm"
                onClick={() => { setActiveTab('register'); setShowAuth(true); setSearchParams({ tab: 'register' }); }}
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2 h-11 px-6 text-sm"
                onClick={() => { setActiveTab('login'); setShowAuth(true); setSearchParams({ tab: 'login' }); }}
              >
                <BookOpen className="w-4 h-4" /> Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b border-border bg-background">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="space-y-1">
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-border py-20 px-4 bg-card">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Everything you need to learn</h2>
            <p className="text-muted-foreground max-w-lg">
              A complete platform built for students who are serious about their education.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
            {features.map((f, i) => (
              <div key={i} className="bg-card p-6 hover:bg-secondary/40 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="border-b border-border py-20 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Get started in 3 steps</h2>
            <p className="text-muted-foreground">From signup to your first session in minutes.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={i} className="space-y-3">
                <div className="text-xs font-mono text-muted-foreground tracking-widest">{s.step}</div>
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden md:flex items-center text-border pt-2">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-b border-border py-20 px-4 bg-card">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Trusted by students</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Sarah M.', role: 'Student', rating: 5, text: 'Found an amazing math tutor within hours. My grades improved dramatically in just 3 weeks of sessions.' },
              { name: 'James K.', role: 'Student', rating: 5, text: 'The real-time chat makes sessions feel like in-person. Best tutoring platform I have used so far.' },
              { name: 'Priya L.', role: 'Student', rating: 5, text: 'Verified tutors give me confidence. I know I am learning from qualified and reviewed professionals.' },
            ].map((t, i) => (
              <div key={i} className="p-6 border border-border bg-background rounded-lg space-y-4">
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-foreground text-foreground" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">"{t.text}"</p>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-primary">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-primary-foreground">
            Ready to start learning?
          </h2>
          <p className="text-primary-foreground/80">
            Join thousands of students already learning on EDUConnect.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="h-11 px-6 font-semibold"
              onClick={() => { setActiveTab('register'); setShowAuth(true); setSearchParams({ tab: 'register' }); }}
            >
              Create Free Account
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-11 px-6 border-primary-foreground/30 text-primary-foreground bg-transparent hover:bg-primary-foreground/10"
              onClick={() => { setActiveTab('login'); setShowAuth(true); setSearchParams({ tab: 'login' }); }}
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold">EDUConnect</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              {['About', 'Privacy', 'Terms', 'Contact'].map(l => (
                <span key={l} className="hover:text-foreground transition-colors cursor-pointer">{l}</span>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">2025 EDUConnect</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
