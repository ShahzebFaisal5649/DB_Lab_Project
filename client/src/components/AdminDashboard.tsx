import React, { useState, useEffect } from 'react'
import { API_BASE_URL } from '../config';
import { useNavigate } from 'react-router-dom';
import { Button } from "./ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Input } from './ui/input'
import { Check, X, Eye, Search, Plus, Users, BookOpen, CalendarDays, TrendingUp, GraduationCap, LogOut, Menu, LayoutDashboard, Star, Shield } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "./ui/table"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "./ui/dialog"
import { Badge } from "./ui/badge"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { ScrollArea } from "./ui/scroll-area"
import toast, { Toaster } from 'react-hot-toast'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

interface User {
  [x: string]: any;
  id: string;
  name: string;
  email: string;
  role: string;
  isVerified?: boolean;
}

interface SessionRequest {
  id: string;
  student: { name: string };
  tutor: { name: string };
  subject: string;
  requestedTime: string;
  status: string;
}

interface Feedback {
  id: string;
  from: { name: string; role: string };
  to: { name: string; role: string };
  rating: number;
  comments: string;
}

interface Subject {
  id: string;
  name: string;
}

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const statusColors: Record<string, string> = {
  pending: 'border-border text-muted-foreground',
  approved: 'border-border text-foreground',
  rejected: 'border-destructive/30 text-destructive',
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [tutors, setTutors] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [sessionRequests, setSessionRequests] = useState<SessionRequest[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newSubject, setNewSubject] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchTutors();
    fetchStudents();
    fetchSessionRequests();
    fetchFeedbacks();
    fetchSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const authHeaders = () => {
    const userId = localStorage.getItem('userId') || '';
    return { 'Content-Type': 'application/json', 'user-id': userId };
  };

  const fetchTutors = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/admin/users?role=TUTOR`, { headers: authHeaders() });
      if (res.ok) { const d = await res.json(); setTutors(d.users || []); }
    } catch (e) { console.error(e); }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/admin/users?role=STUDENT`, { headers: authHeaders() });
      if (res.ok) { const d = await res.json(); setStudents(d.users || []); }
    } catch (e) { console.error(e); }
  };

  const fetchSessionRequests = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const role = localStorage.getItem('userRole');
      const res = await fetch(`${API_BASE_URL}/api/users/session-requests?role=${role}&userId=${userId}`, {
        headers: { 'user-id': userId || '' },
      });
      if (res.ok) { const d = await res.json(); setSessionRequests(d.requests || []); }
    } catch (e) { console.error(e); }
  };

  const fetchFeedbacks = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/feedbacks`, { headers: authHeaders() });
      if (res.ok) { const d = await res.json(); setFeedbacks(d.feedbacks || []); }
    } catch (e) { console.error(e); }
  };

  const fetchSubjects = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/subjects`, { headers: authHeaders() });
      if (res.ok) { const d = await res.json(); setSubjects(d.subjects || []); }
    } catch (e) { console.error(e); }
  };

  const handleVerify = async (userId: string, isVerified: boolean) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/admin/users/${userId}/verify`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ isVerified }),
      });
      if (res.ok) {
        toast.success(`Tutor ${isVerified ? 'verified' : 'unverified'}`);
        setTutors(prev => prev.map(t => t.id === userId ? { ...t, isVerified } : t));
      } else {
        toast.error('Failed to update verification');
      }
    } catch (e) { toast.error('An error occurred'); }
  };

  const viewVerificationDocument = (userId: string) => {
    const authUserId = localStorage.getItem('userId') || '';
    fetch(`${API_BASE_URL}/api/users/admin/verification-document/${userId}`, {
      headers: { 'user-id': authUserId },
    })
      .then(r => r.ok ? r.blob() : Promise.reject())
      .then(blob => window.open(URL.createObjectURL(blob), '_blank'))
      .catch(() => toast.error('Document not available'));
  };

  const addSubject = async () => {
    if (!newSubject.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/subjects`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ name: newSubject }),
      });
      if (res.ok) {
        toast.success('Subject added');
        setNewSubject('');
        fetchSubjects();
      }
    } catch (e) { toast.error('Failed to add subject'); }
  };

  const deleteSubject = async (subjectId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/subjects/${subjectId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (res.ok) { toast.success('Subject deleted'); fetchSubjects(); }
    } catch (e) { toast.error('Failed to delete subject'); }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const filteredTutors = tutors.filter(t =>
    t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Chart Data
  const sessionsByStatus = [
    { name: 'Pending', value: sessionRequests.filter(s => s.status?.toLowerCase() === 'pending').length },
    { name: 'Approved', value: sessionRequests.filter(s => s.status?.toLowerCase() === 'approved').length },
    { name: 'Rejected', value: sessionRequests.filter(s => s.status?.toLowerCase() === 'rejected').length },
  ];

  const userDistribution = [
    { name: 'Tutors', value: tutors.length },
    { name: 'Students', value: students.length },
  ];

  // Mock monthly sessions for bar chart
  const monthlySessionData = [
    { month: 'Aug', sessions: 12 },
    { month: 'Sep', sessions: 19 },
    { month: 'Oct', sessions: 15 },
    { month: 'Nov', sessions: 27 },
    { month: 'Dec', sessions: 23 },
    { month: 'Jan', sessions: 31 },
    { month: 'Feb', sessions: sessionRequests.length },
  ];

  const avgRating = feedbacks.length > 0
    ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
    : '—';

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Toaster position="top-right" />

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-full md:h-screen w-64 z-40 md:z-auto
        flex flex-col border-r border-border bg-card
        transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-4 border-b border-border flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold tracking-tight">EDUConnect</span>
        </div>

        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
              A
            </div>
            <div>
              <p className="font-medium text-sm">Administrator</p>
              <Badge variant="secondary" className="text-xs">Admin</Badge>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {[
            { icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard' },
            { icon: <Users className="w-4 h-4" />, label: 'Tutors' },
            { icon: <BookOpen className="w-4 h-4" />, label: 'Students' },
            { icon: <CalendarDays className="w-4 h-4" />, label: 'Sessions' },
            { icon: <Star className="w-4 h-4" />, label: 'Feedback' },
            { icon: <Shield className="w-4 h-4" />, label: 'Subjects' },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer transition-all"
            >
              {item.icon}
              {item.label}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 rounded-lg hover:bg-accent" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-4 h-4" />
            </button>
            <div>
              <h1 className="font-semibold text-sm">Admin Dashboard</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </header>

        <ScrollArea className="flex-1">
          <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Tutors', value: tutors.length, icon: <GraduationCap className="w-4 h-4" /> },
                { label: 'Total Students', value: students.length, icon: <Users className="w-4 h-4" /> },
                { label: 'Sessions', value: sessionRequests.length, icon: <CalendarDays className="w-4 h-4" /> },
                { label: 'Avg. Rating', value: avgRating, icon: <Star className="w-4 h-4" /> },
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

            {/* Charts Row */}
            <div className="grid lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" /> Sessions Over Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={monthlySessionData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: 12,
                          color: 'hsl(var(--foreground))',
                        }}
                      />
                      <Bar dataKey="sessions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" /> User Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={userDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={false}
                      >
                        {userDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: 12,
                        }}
                      />
                      <Legend iconType="circle" iconSize={8} formatter={(value) => (
                        <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>{value}</span>
                      )} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Session Status Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Session Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {sessionsByStatus.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary">
                      <div className="w-3 h-3 rounded-full" style={{ background: CHART_COLORS[i] }} />
                      <span className="text-sm font-medium">{s.value}</span>
                      <span className="text-sm text-muted-foreground">{s.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="tutors" className="space-y-4">
              <TabsList className="grid w-full grid-cols-5 h-10">
                <TabsTrigger value="tutors" className="text-xs sm:text-sm">Tutors</TabsTrigger>
                <TabsTrigger value="students" className="text-xs sm:text-sm">Students</TabsTrigger>
                <TabsTrigger value="sessions" className="text-xs sm:text-sm">Sessions</TabsTrigger>
                <TabsTrigger value="feedbacks" className="text-xs sm:text-sm">Feedback</TabsTrigger>
                <TabsTrigger value="subjects" className="text-xs sm:text-sm">Subjects</TabsTrigger>
              </TabsList>

              {/* TUTORS */}
              <TabsContent value="tutors">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <CardTitle className="text-base">Tutors</CardTitle>
                        <CardDescription>Verify and manage tutors</CardDescription>
                      </div>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          placeholder="Search tutors..."
                          className="pl-8 h-8 text-sm w-48"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tutor</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTutors.map((tutor) => (
                          <TableRow key={tutor.id} className="hover:bg-accent/50">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="w-7 h-7">
                                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                    {tutor.name?.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-sm">{tutor.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{tutor.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {tutor.isVerified ? 'Verified' : 'Unverified'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1.5 flex-wrap">
                                <Button size="sm" className="h-7 text-xs gap-1" onClick={() => handleVerify(tutor.id, true)}>
                                  <Check className="h-3 w-3" /> Verify
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleVerify(tutor.id, false)}>
                                  <X className="h-3 w-3" /> Revoke
                                </Button>
                                <Button size="sm" variant="secondary" className="h-7 text-xs gap-1" onClick={() => viewVerificationDocument(tutor.id)}>
                                  <Eye className="h-3 w-3" /> Doc
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredTutors.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-sm">
                              No tutors found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* STUDENTS */}
              <TabsContent value="students">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Students</CardTitle>
                    <CardDescription>All registered students</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Email</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map((student) => (
                          <TableRow key={student.id} className="hover:bg-accent/50">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="w-7 h-7">
                                  <AvatarFallback className="bg-blue-500/10 text-blue-500 text-xs">
                                    {student.name?.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-sm">{student.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{student.email}</TableCell>
                          </TableRow>
                        ))}
                        {students.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center py-8 text-muted-foreground text-sm">
                              No students yet
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* SESSIONS */}
              <TabsContent value="sessions">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Session Requests</CardTitle>
                    <CardDescription>All session requests across the platform</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Tutor</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sessionRequests.map((req) => (
                          <TableRow key={req.id} className="hover:bg-accent/50">
                            <TableCell className="text-sm">{req.student?.name}</TableCell>
                            <TableCell className="text-sm">{req.tutor?.name}</TableCell>
                            <TableCell className="text-sm">{req.subject}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(req.requestedTime).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-xs ${statusColors[req.status?.toLowerCase()] || ''}`}>
                                {req.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                        {sessionRequests.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                              No sessions yet
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* FEEDBACKS */}
              <TabsContent value="feedbacks">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Feedback</CardTitle>
                    <CardDescription>All session feedback and ratings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>From</TableHead>
                          <TableHead>To</TableHead>
                          <TableHead>Rating</TableHead>
                          <TableHead>Comments</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {feedbacks.map((fb) => (
                          <TableRow key={fb.id} className="hover:bg-accent/50">
                            <TableCell className="text-sm">{fb.from?.name} <span className="text-muted-foreground text-xs">({fb.from?.role})</span></TableCell>
                            <TableCell className="text-sm">{fb.to?.name} <span className="text-muted-foreground text-xs">({fb.to?.role})</span></TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-yellow-400">
                                {Array.from({ length: fb.rating }).map((_, j) => (
                                  <Star key={j} className="w-3 h-3 fill-current" />
                                ))}
                                <span className="text-xs text-muted-foreground ml-1">{fb.rating}/5</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{fb.comments}</TableCell>
                          </TableRow>
                        ))}
                        {feedbacks.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-sm">
                              No feedback yet
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* SUBJECTS */}
              <TabsContent value="subjects">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <CardTitle className="text-base">Subjects</CardTitle>
                        <CardDescription>Manage available subjects</CardDescription>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" className="gap-1.5 h-8">
                            <Plus className="h-3.5 w-3.5" /> Add Subject
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add New Subject</DialogTitle>
                            <DialogDescription>Enter the name of the subject to add to the platform.</DialogDescription>
                          </DialogHeader>
                          <div className="flex gap-2 py-2">
                            <Input
                              placeholder="e.g. Advanced Mathematics"
                              value={newSubject}
                              onChange={(e) => setNewSubject(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && addSubject()}
                            />
                            <Button onClick={addSubject}>Add</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {subjects.map((subject) => (
                        <div key={subject.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-secondary hover:border-destructive/30 group transition-colors">
                          <span className="text-sm">{subject.name}</span>
                          <button
                            onClick={() => deleteSubject(subject.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {subjects.length === 0 && (
                        <p className="text-sm text-muted-foreground py-4">No subjects added yet. Add your first subject above.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

          </div>
        </ScrollArea>
      </main>
    </div>
  );
};

export default AdminDashboard;
