import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import {
  CalendarDays, MessageSquare, LogOut, Search, Star,
  LayoutDashboard, Users, User, CheckCircle2,
  Clock, Plus, Menu, GraduationCap, Filter,
  ChevronRight, Bell, Upload, AlertCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import toast, { Toaster } from 'react-hot-toast';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { Label } from './ui/label';
import { DialogHeader } from './ui/dialog';
import { Separator } from './ui/separator';

interface DashboardProps {
  setIsLoggedIn: (value: boolean) => void;
  userRole: string | null;
  userId: string | null;
}

interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  subjects?: { name: string }[];
  preferredSubjects?: { name: string }[];
  location?: string;
  availability?: string;
  learningGoals?: string;
  isVerified?: boolean;
}

interface SessionRequest {
  id: number;
  sessionId?: number | null;
  student: { name: string; id: number };
  tutor: { name: string; id: number };
  subject: string;
  requestedTime: string;
  status: string;
}

interface SearchResult {
  id: number;
  name: string;
  email: string;
  role: string;
  subjects?: { name: string }[];
  isVerified?: boolean;
}

interface FeedbackData {
  rating: number;
  comments: string;
}

interface Subject {
  id: string;
  name: string;
}

type ActiveSection = 'overview' | 'find-tutors' | 'sessions' | 'profile';

const navItems = [
  { id: 'overview' as ActiveSection, label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'find-tutors' as ActiveSection, label: 'Find Tutors', icon: <Users className="w-4 h-4" /> },
  { id: 'sessions' as ActiveSection, label: 'My Sessions', icon: <CalendarDays className="w-4 h-4" /> },
  { id: 'profile' as ActiveSection, label: 'Profile', icon: <User className="w-4 h-4" /> },
];

export default function Dashboard({ setIsLoggedIn, userRole, userId }: DashboardProps) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sessionRequests, setSessionRequests] = useState<SessionRequest[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSection, setActiveSection] = useState<ActiveSection>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [feedbackData, setFeedbackData] = useState<FeedbackData>({ rating: 5, comments: '' });
  const [isSearching, setIsSearching] = useState(false);
  const [verificationFile, setVerificationFile] = useState<File | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectFilter, setSubjectFilter] = useState('all');

  const userName = localStorage.getItem('userName') || profile?.name || 'User';
  const initials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  useEffect(() => {
    if (!userId) return;
    fetchProfile();
    fetchSessionRequests();
    fetchSubjects();
    searchTutors('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/profile/${userId}`, {
        headers: { 'user-id': userId || '' },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user || data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const fetchSessionRequests = async () => {
    try {
      const role = localStorage.getItem('userRole') || '';
      const res = await fetch(
        `${API_BASE_URL}/api/users/session-requests?role=${role}&userId=${userId}`,
        { headers: { 'user-id': userId || '' } }
      );
      if (res.ok) {
        const data = await res.json();
        setSessionRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/subjects`);
      if (res.ok) {
        const data = await res.json();
        setSubjects(data.subjects || []);
      }
    } catch (err) { /* silent */ }
  };

  const searchTutors = async (query: string) => {
    setIsSearching(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/users/search?query=${encodeURIComponent(query)}&role=TUTOR`,
        { headers: { 'user-id': userId || '' } }
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.users || []);
      }
    } catch (err) {
      console.error('Error searching:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchTerm(q);
    const timer = setTimeout(() => searchTutors(q), 300);
    return () => clearTimeout(timer);
  };

  const handleSessionResponse = async (sessionId: number, status: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/session/${sessionId}/respond`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'user-id': userId || '' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success(`Session ${status.toLowerCase()} successfully`);
        fetchSessionRequests();
      } else {
        toast.error('Failed to update session');
      }
    } catch (err) {
      toast.error('An error occurred');
    }
  };

  const handleFeedbackSubmit = async (sessionId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/session/${sessionId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'user-id': userId || '' },
        body: JSON.stringify({ ...feedbackData, fromId: userId }),
      });
      if (res.ok) {
        toast.success('Feedback submitted!');
        setFeedbackData({ rating: 5, comments: '' });
      } else {
        toast.error('Failed to submit feedback');
      }
    } catch (err) {
      toast.error('An error occurred');
    }
  };

  const handleUploadVerification = async () => {
    if (!verificationFile) return;
    const formData = new FormData();
    formData.append('document', verificationFile);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/upload-verification/${userId}`, {
        method: 'POST',
        headers: { 'user-id': userId || '' },
        body: formData,
      });
      if (res.ok) {
        toast.success('Verification document uploaded!');
        setVerificationFile(null);
      } else {
        toast.error('Upload failed');
      }
    } catch (err) {
      toast.error('An error occurred');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    navigate('/');
  };

  // Stats calculations
  const pendingCount = sessionRequests.filter(s => s.status?.toLowerCase() === 'pending').length;
  const approvedCount = sessionRequests.filter(s => s.status?.toLowerCase() === 'accepted').length;
  const totalCount = sessionRequests.length;

  const filteredTutors = subjectFilter === 'all'
    ? searchResults
    : searchResults.filter(t => t.subjects?.some(s => s.name === subjectFilter));

  const statusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'accepted': return 'border-border text-foreground';
      case 'pending': return 'border-border text-muted-foreground';
      case 'declined': return 'border-destructive/30 text-destructive';
      default: return 'border-border text-muted-foreground';
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Toaster position="top-right" />

      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-full md:h-screen w-64 z-40 md:z-auto
        flex flex-col border-r border-border bg-card
        transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-4 border-b border-border flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold tracking-tight">EDUConnect</span>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Avatar className="w-9 h-9">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{userName}</p>
              <Badge variant="secondary" className="text-xs mt-0.5">
                {userRole === 'TUTOR' ? 'Tutor' : 'Student'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems
            .filter(item => !(item.id === 'find-tutors' && userRole === 'TUTOR'))
            .map(item => (
              <button
                key={item.id}
                onClick={() => { setActiveSection(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  activeSection === item.id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                {item.icon}
                {item.label}
                {item.id === 'sessions' && pendingCount > 0 && (
                  <Badge className="ml-auto bg-primary text-primary-foreground border-0 text-xs px-1.5 py-0 h-5">
                    {pendingCount}
                  </Badge>
                )}
              </button>
            ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded-lg hover:bg-accent"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-4 h-4" />
            </button>
            <div>
              <h1 className="font-semibold text-sm">
                {navItems.find(n => n.id === activeSection)?.label || 'Dashboard'}
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <button
                onClick={() => setActiveSection('sessions')}
                className="relative p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
              </button>
            )}
            <Avatar className="w-7 h-7 cursor-pointer" onClick={() => setActiveSection('profile')}>
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Content Area */}
        <ScrollArea className="flex-1">
          <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">

            {/* OVERVIEW */}
            {activeSection === 'overview' && (
              <>
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {userName.split(' ')[0]}</h2>
                  <p className="text-muted-foreground text-sm">Here's what's happening with your sessions.</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Sessions', value: totalCount, icon: <CalendarDays className="w-4 h-4" /> },
                    { label: 'Pending', value: pendingCount, icon: <Clock className="w-4 h-4" /> },
                    { label: 'Approved', value: approvedCount, icon: <CheckCircle2 className="w-4 h-4" /> },
                    { label: 'Tutors Found', value: searchResults.length, icon: <Users className="w-4 h-4" /> },
                  ].map((stat, i) => (
                    <Card key={i} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</span>
                          <span className="p-1.5 rounded-md bg-secondary text-muted-foreground">
                            {stat.icon}
                          </span>
                        </div>
                        <p className="text-3xl font-bold">{stat.value}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Recent Activity */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Recent Sessions</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setActiveSection('sessions')} className="text-primary gap-1 text-xs">
                        View all <ChevronRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {sessionRequests.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">No sessions yet.</p>
                        {userRole === 'STUDENT' && (
                          <Button variant="outline" size="sm" className="mt-3" onClick={() => setActiveSection('find-tutors')}>
                            <Plus className="w-3 h-3 mr-1" /> Find a tutor
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {sessionRequests.slice(0, 5).map(req => (
                          <div key={req.id} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar className="w-8 h-8 shrink-0">
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                  {(userRole === 'TUTOR' ? req.student?.name : req.tutor?.name)?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {userRole === 'TUTOR' ? req.student?.name : req.tutor?.name}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">{req.subject}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              <span className="text-xs text-muted-foreground hidden sm:block">
                                {new Date(req.requestedTime).toLocaleDateString()}
                              </span>
                              <Badge variant="outline" className={`text-xs ${statusColor(req.status)}`}>
                                {req.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Tutor CTA for students */}
                {userRole === 'STUDENT' && (
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-semibold">Ready to find your perfect tutor?</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">Browse 500+ verified tutors across 50+ subjects.</p>
                      </div>
                      <Button className="shrink-0" onClick={() => setActiveSection('find-tutors')}>
                        Browse Tutors <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Verification upload for tutors */}
                {userRole === 'TUTOR' && (
                  <Card className="border-border bg-secondary/40">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="space-y-3 flex-1">
                          <div>
                            <h3 className="font-semibold text-sm">Upload Verification Document</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Upload your credentials PDF to become a verified tutor.</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="file"
                              accept=".pdf"
                              onChange={e => setVerificationFile(e.target.files?.[0] || null)}
                              className="text-xs h-8"
                            />
                            {verificationFile && (
                              <Button size="sm" onClick={handleUploadVerification} className="shrink-0 h-8">
                                <Upload className="w-3 h-3 mr-1" /> Upload
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* FIND TUTORS */}
            {activeSection === 'find-tutors' && userRole === 'STUDENT' && (
              <>
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold">Find Tutors</h2>
                  <p className="text-muted-foreground text-sm">Browse verified tutors and request a session.</p>
                </div>

                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, subject..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={handleSearch}
                    />
                  </div>
                  <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                    <SelectTrigger className="w-44">
                      <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subjects</SelectItem>
                      {subjects.map(s => (
                        <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {isSearching ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-48 rounded-xl bg-secondary animate-pulse" />
                    ))}
                  </div>
                ) : filteredTutors.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p>No tutors found. Try a different search.</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTutors.map(tutor => (
                      <Card key={tutor.id} className="hover:shadow-md hover:border-primary/30 transition-all group">
                        <CardContent className="p-5 space-y-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="w-12 h-12">
                              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                                {tutor.name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-sm truncate">{tutor.name}</p>
                                {tutor.isVerified && (
                                  <Badge variant="outline" className="text-xs px-1.5 border-border text-muted-foreground">
                                    Verified
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{tutor.email}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {(tutor.subjects || []).slice(0, 3).map(s => (
                              <Badge key={s.name} variant="secondary" className="text-xs">{s.name}</Badge>
                            ))}
                            {(tutor.subjects || []).length > 3 && (
                              <Badge variant="secondary" className="text-xs">+{tutor.subjects!.length - 3}</Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-1 text-yellow-400">
                            {Array.from({ length: 5 }).map((_, j) => (
                              <Star key={j} className="w-3 h-3 fill-current" />
                            ))}
                            <span className="text-xs text-muted-foreground ml-1">5.0</span>
                          </div>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                className="w-full h-9 text-sm"
                                        >
                                Request Session
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Request Session with {tutor.name}</DialogTitle>
                                <DialogDescription>Fill in the session details below.</DialogDescription>
                              </DialogHeader>
                              <RequestSessionForm
                                tutorId={tutor.id}
                                userId={userId}
                                subjects={tutor.subjects || []}
                                onSuccess={() => {
                                  fetchSessionRequests();
                                  setActiveSection('sessions');
                                }}
                              />
                            </DialogContent>
                          </Dialog>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* SESSIONS */}
            {activeSection === 'sessions' && (
              <>
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold">My Sessions</h2>
                  <p className="text-muted-foreground text-sm">
                    {userRole === 'TUTOR' ? 'Manage incoming session requests.' : 'Track all your booked sessions.'}
                  </p>
                </div>

                {sessionRequests.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">No sessions yet.</p>
                    {userRole === 'STUDENT' && (
                      <Button variant="outline" size="sm" className="mt-3" onClick={() => setActiveSection('find-tutors')}>
                        <Plus className="w-3 h-3 mr-1" /> Find a tutor
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sessionRequests.map(req => (
                      <Card key={req.id} className="hover:shadow-sm transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                                  {(userRole === 'TUTOR' ? req.student?.name : req.tutor?.name)?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">
                                  {userRole === 'TUTOR' ? req.student?.name : req.tutor?.name}
                                </p>
                                <p className="text-xs text-muted-foreground">{req.subject}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs text-muted-foreground">
                                {new Date(req.requestedTime).toLocaleString()}
                              </span>
                              <Badge variant="outline" className={`text-xs ${statusColor(req.status)}`}>
                                {req.status}
                              </Badge>
                              {userRole === 'TUTOR' && req.status?.toLowerCase() === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => handleSessionResponse(req.id, 'accepted')}
                                  >
                                    Accept
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                                    onClick={() => handleSessionResponse(req.id, 'declined')}
                                  >
                                    Decline
                                  </Button>
                                </>
                              )}
                              {req.status?.toLowerCase() === 'accepted' && (
                                <>
                                  {req.sessionId && (
                                    <Link to={`/chat/${req.sessionId}`}>
                                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                                        <MessageSquare className="w-3 h-3" /> Chat
                                      </Button>
                                    </Link>
                                  )}
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                                        <Star className="w-3 h-3" /> Feedback
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Leave Feedback</DialogTitle>
                                        <DialogDescription>Rate your experience with this session.</DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-4 py-2">
                                        <div className="space-y-2">
                                          <Label>Rating</Label>
                                          <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map(r => (
                                              <button
                                                key={r}
                                                onClick={() => setFeedbackData(f => ({ ...f, rating: r }))}
                                                className={`p-2 rounded-lg transition-colors ${feedbackData.rating >= r ? 'text-yellow-400' : 'text-muted-foreground'}`}
                                              >
                                                <Star className={`w-5 h-5 ${feedbackData.rating >= r ? 'fill-current' : ''}`} />
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                        <div className="space-y-2">
                                          <Label>Comments</Label>
                                          <Textarea
                                            placeholder="Share your experience..."
                                            value={feedbackData.comments}
                                            onChange={e => setFeedbackData(f => ({ ...f, comments: e.target.value }))}
                                            rows={3}
                                          />
                                        </div>
                                      </div>
                                      <DialogFooter>
                                        <Button
                                          className=""
                                          onClick={() => handleFeedbackSubmit(req.id)}
                                        >
                                          Submit Feedback
                                        </Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                </>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* PROFILE */}
            {activeSection === 'profile' && profile && (
              <>
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold">Profile</h2>
                  <p className="text-muted-foreground text-sm">Manage your account information.</p>
                </div>

                <Card>
                  <CardContent className="p-6 space-y-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-16 h-16">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xl">{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-xl font-bold">{profile.name}</h3>
                        <p className="text-muted-foreground text-sm">{profile.email}</p>
                        <Badge variant="secondary" className="mt-1.5">
                          {profile.role === 'TUTOR' ? 'Tutor' : 'Student'}
                        </Badge>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid sm:grid-cols-2 gap-6">
                      {profile.role === 'TUTOR' ? (
                        <>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Subjects</p>
                            <div className="flex flex-wrap gap-1.5">
                              {(profile.subjects || []).map(s => (
                                <Badge key={s.name} variant="secondary">{s.name}</Badge>
                              ))}
                              {(!profile.subjects || profile.subjects.length === 0) && (
                                <span className="text-sm text-muted-foreground">No subjects set</span>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Location</p>
                            <p className="text-sm">{profile.location || '—'}</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Learning Goals</p>
                            <p className="text-sm">{profile.learningGoals || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Preferred Subjects</p>
                            <div className="flex flex-wrap gap-1.5">
                              {(profile.preferredSubjects || []).map(s => (
                                <Badge key={s.name} variant="secondary">{s.name}</Badge>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <Button variant="outline" size="sm" className="gap-2">
                        <User className="w-4 h-4" /> Edit Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

          </div>
        </ScrollArea>
      </main>
    </div>
  );
}

// Inline session request form component
interface RequestSessionFormProps {
  tutorId: number;
  userId: string | null;
  subjects: { name: string }[];
  onSuccess: () => void;
}

function RequestSessionForm({ tutorId, userId, subjects, onSuccess }: RequestSessionFormProps) {
  const [subject, setSubject] = useState('');
  const [requestedTime, setRequestedTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !requestedTime) {
      toast.error('Please fill in all fields');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/session/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tutorId, studentId: userId, subject, requestedTime }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Session requested successfully!');
        onSuccess();
      } else {
        toast.error(data.message || 'Failed to request session');
      }
    } catch (err) {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2">
      <div className="space-y-2">
        <Label>Subject</Label>
        {subjects.length > 0 ? (
          <Select onValueChange={setSubject}>
            <SelectTrigger>
              <SelectValue placeholder="Select a subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map(s => (
                <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input placeholder="Enter subject" value={subject} onChange={e => setSubject(e.target.value)} />
        )}
      </div>
      <div className="space-y-2">
        <Label>Preferred Date & Time</Label>
        <Input type="datetime-local" value={requestedTime} onChange={e => setRequestedTime(e.target.value)} />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Requesting...
            </span>
          ) : 'Send Request'}
        </Button>
      </DialogFooter>
    </form>
  );
}
