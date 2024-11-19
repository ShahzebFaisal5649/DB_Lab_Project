// frontend/src/components/Dashboard.tsx
import React, { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from "./ui/label";
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { CalendarDays, MessageSquare, User, LogOut, Search, Upload, Star, Badge } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import toast, { Toaster } from 'react-hot-toast';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';

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
  availability?: string; // JSON string or structured data
  learningGoals?: string;
}

interface SessionRequest {
  id: number;
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
  preferredSubjects?: { name: string }[];
}

interface Session {
  id: number;
  status: ReactNode;
  tutor: { id: number; name: string };
  students: { id: number; name: string }[];
  messages: { id: number; content: string; senderId: number; createdAt: string }[];
  feedbackProvided?: boolean;
  sessionRequest?: {
    id: number;
    feedback?: {
      id: number;
      rating: number;
      comments?: string;
    }
  };
}

const Dashboard: React.FC<DashboardProps> = ({ setIsLoggedIn, userRole, userId }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selectedTutor, setSelectedTutor] = useState<SearchResult | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionRequests, setSessionRequests] = useState<SessionRequest[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [mainSearchQuery, setMainSearchQuery] = useState('');
  const [mainSearchResults, setMainSearchResults] = useState<SearchResult[]>([]);
  const [sessionSearchQuery, setSessionSearchQuery] = useState('');
  const [sessionSearchResults, setSessionSearchResults] = useState<SearchResult[]>([]);
  const [newSessionStudents, setNewSessionStudents] = useState<number[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null);
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newSessionRequest, setNewSessionRequest] = useState({
    tutorId: '',
    subject: '',
    requestedTime: '',
    content: '',
  });

  const [feedbackForm, setFeedbackForm] = useState({
    sessionId: '',
    tutorId: '',
    tutorName: '',
    rating: 0,
    comments: '',
  });

  // Fetch Subjects
  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);
  const fetchSubjects = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users/subjects');
      const data = await response.json();
      if (response.ok) {
        setSubjects(data.subjects);
      } else {
        throw new Error(data.message || 'Failed to fetch subjects');
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to load subjects');
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    const fetchProfileAndSessions = async () => {
      if (userId) {
        try {
          // Fetch user profile
          const profileResponse = await fetch(`http://localhost:5000/api/users/profile/${userId}`);
          const profileData = await profileResponse.json();
          if (!profileResponse.ok) {
            throw new Error(profileData.message || 'Failed to fetch profile');
          }
          setProfile({
            id: profileData.user.id,
            name: profileData.user.name,
            email: profileData.user.email,
            role: profileData.user.role,
            subjects: profileData.user.tutor?.subjects || [],
            preferredSubjects: profileData.user.student?.preferredSubjects || [],
            location: profileData.user.tutor?.location || '',
            availability: profileData.user.tutor?.availability || '',
            learningGoals: profileData.user.student?.learningGoals || '',
          });

          toast.success('Profile loaded successfully');

          // Fetch sessions
          const sessionResponse = await fetch(`http://localhost:5000/api/users/sessions/${userId}`);
          const sessionData = await sessionResponse.json();
          if (!sessionResponse.ok) {
            throw new Error(sessionData.message || 'Failed to fetch sessions');
          }
          setSessions(sessionData);
          toast.success('Sessions loaded successfully');
        } catch (error) {
          console.error('Error fetching data:', error);
          toast.error('Failed to load profile or sessions');
        }
      }
    };

    fetchProfileAndSessions();
  }, [userId]);

  useEffect(() => {
    const fetchSessionRequests = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/users/session-requests?role=${userRole}&userId=${userId}`
        );
        if (response.ok) {
          const data = await response.json();
          // Map the data to ensure student and tutor names are properly assigned
          const formattedRequests = data.requests.map((request: any) => ({
            ...request,
            student: request.student || null,
            tutor: request.tutor || null,
            subject: request.subject || '',
          }));
          setSessionRequests(formattedRequests);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch session requests');
        }
      } catch (error) {
        console.error('Error fetching session requests:', error);
        toast.error('Failed to load session requests');
      }
    };

    if (userRole && userId) {
      fetchSessionRequests();
    }
  }, [userId, userRole]);

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    toast.success('Logged out successfully');
    navigate('/');
  };

  const handleMainSearch = async () => {
    if (!mainSearchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/users/search?query=${encodeURIComponent(mainSearchQuery)}&role=${userRole}`
      );
      const data = await response.json();
      if (response.ok) {
        setMainSearchResults(data.results);
        toast.success(`Found ${data.results.length} results`);
      } else {
        throw new Error(data.message || 'Search failed');
      }
    } catch (error) {
      console.error('Error searching:', error);
      setMainSearchResults([]);
      toast.error('Failed to search. Please try again.');
    }
  };

  const handleSessionSearch = async () => {
    if (!sessionSearchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    try {
      // For tutors, we always want to search for students
      const searchRole = userRole === 'TUTOR' ? 'STUDENT' : 'TUTOR';
      const response = await fetch(
        `http://localhost:5000/api/users/search?query=${encodeURIComponent(sessionSearchQuery)}&role=${searchRole}`
      );
      const data = await response.json();
      if (response.ok) {
        setSessionSearchResults(data.results);
        if (data.results.length === 0) {
          toast.error('No results found');
        } else {
          toast.success(`Found ${data.results.length} results`);
        }
      } else {
        throw new Error(data.message || 'Search failed');
      }
    } catch (error) {
      console.error('Error searching:', error);
      setSessionSearchResults([]);
      toast.error('Failed to search for session participants.');
    }
  };

  const handleSessionRequest = async (tutor: SearchResult) => {
    try {
      setSelectedTutor(tutor);
      setNewSessionRequest({
        ...newSessionRequest,
        tutorId: tutor.id.toString(),
        subject: '', // Reset the form when selecting a new tutor
        requestedTime: '',
        content: ''
      });

      // Fetch updated subjects for the selected tutor
      const response = await fetch(`http://localhost:5000/api/users/subjects`);
      const data = await response.json();
      if (response.ok) {
        setSubjects(data.subjects);
      } else {
        throw new Error(data.message || 'Failed to fetch subjects');
      }
    } catch (error) {
      console.error('Error preparing session request:', error);
      toast.error('Failed to prepare session request');
    }
  };

  const submitSessionRequest = async () => {
    if (!selectedTutor) {
      toast.error('Please select a tutor first');
      return;
    }

    if (!newSessionRequest.subject) {
      toast.error('Please select a subject');
      return;
    }

    if (!newSessionRequest.requestedTime) {
      toast.error('Please select a preferred time');
      return;
    }

    if (!newSessionRequest.content) {
      toast.error('Please provide session details');
      return;
    }

    // More flexible datetime validation
    const requestedTime = new Date(newSessionRequest.requestedTime);
    const now = new Date();
    const minimumTime = new Date(now.getTime() - (5 * 60 * 1000)); // 5 minutes grace period

    if (requestedTime < minimumTime) {
      toast.error('Please select a future time for the session');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:5000/api/users/session/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: parseInt(userId as string),
          tutorId: parseInt(newSessionRequest.tutorId),
          subject: newSessionRequest.subject,
          content: newSessionRequest.content,
          requestedTime: newSessionRequest.requestedTime,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send session request');
      }

      // Success handling
      toast.success('Session request sent successfully!');

      // Reset the form
      setNewSessionRequest({
        tutorId: '',
        subject: '',
        requestedTime: '',
        content: '',
      });
      setSelectedTutor(null);

      // Refresh session requests list
      const refreshedRequests = await fetch(
        `http://localhost:5000/api/users/session-requests?role=${userRole}&userId=${userId}`
      );
      if (refreshedRequests.ok) {
        const refreshedData = await refreshedRequests.json();
        setSessionRequests(refreshedData.requests);
      }
    } catch (error) {
      console.error('Error sending session request:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send session request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSessionResponse = async (sessionRequestId: number, status: 'accepted' | 'declined') => {
    try {
      const sessionRequest = sessionRequests.find(req => req.id === sessionRequestId);
      if (!sessionRequest) {
        toast.error('Session request not found');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/users/session/${sessionRequestId}/respond`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();
      if (response.ok) {
        // Update local state for session requests
        setSessionRequests(prevRequests =>
          prevRequests.map(req =>
            req.id === sessionRequestId ? { ...req, status } : req
          )
        );

        if (status === 'accepted') {
          if (data.session) {
            setSessions(prevSessions => [...prevSessions, data.session]);
            toast.success('Session request accepted and session created');
          } else {
            toast.error('Session was not created properly');
          }
        } else {
          toast.success('Session request declined');
        }
      } else {
        throw new Error(data.message || 'Failed to update session status');
      }
    } catch (error) {
      console.error('Error updating session status:', error);
      toast.error(error instanceof Error ? error.message : 'Error updating session status');
    }
  };

  const handleFeedbackSubmit = async () => {
    try {
      if (!feedbackForm.sessionId || !feedbackForm.tutorId) {
        toast.error('Please select a session');
        return;
      }
  
      if (!feedbackForm.rating) {
        toast.error('Please provide a rating');
        return;
      }
  
      const response = await fetch(`http://localhost:5000/api/users/session/${feedbackForm.sessionId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: feedbackForm.rating,
          comments: feedbackForm.comments,
          fromId: parseInt(userId as string), // Student's user ID
        }),
      });
  
      const data = await response.json();
      if (response.ok) {
        toast.success('Feedback submitted successfully');
        setSessions(prevSessions =>
          prevSessions.map(session =>
            session.id === parseInt(feedbackForm.sessionId)
              ? { ...session, feedbackProvided: true }
              : session
          )
        );
        setFeedbackForm({ sessionId: '', tutorId: '', tutorName: '', rating: 0, comments: '' });
      } else {
        toast.error(data.message || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Error submitting feedback');
    }
  };

  const handleCreateSession = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tutorId: userId,
          studentIds: newSessionStudents,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create session');
      }

      const newSession = await response.json();
      setSessions([...sessions, newSession]);
      setNewSessionStudents([]);
      toast.success('New session created successfully');
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create new session');
    }
  };

  const handleDeleteSession = async (sessionId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (response.ok) {
        setSessions(sessions.filter(session => session.id !== sessionId));
        toast.success('Session deleted successfully');
      } else {
        toast.error(`Failed to delete session: ${data.message}`);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session');
    }
  };

  const handleEditProfile = () => {
    setIsEditing(true);
    setEditedProfile(profile);
  };

  const handleSaveProfile = async () => {
    if (!editedProfile) return;

    try {
      const response = await fetch(`http://localhost:5000/api/users/profile/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedProfile),
      });

      const data = await response.json();
      if (response.ok) {
        setProfile(data.user);
        setIsEditing(false);
        toast.success('Profile updated successfully');
      } else {
        toast.error(`Failed to update profile: ${data.message}`);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleUploadDocument = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('document', file);

    try {
      const response = await fetch(`http://localhost:5000/api/users/upload-verification/${userId}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        console.log('Document uploaded successfully');
        toast.success('Document uploaded successfully');
      } else {
        toast.error(`Failed to upload document: ${data.message}`);
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    }
  };

  const renderSessionRequests = () => (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Session Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          {sessionRequests.map((request) => (
            <Card key={request.id} className="mb-4">
              <CardContent className="p-4">
                <p>
                  <strong>{userRole === 'STUDENT' ? 'Tutor' : 'Student'}:</strong>{' '}
                  {userRole === 'STUDENT'
                    ? request.tutor?.name || 'Unknown'
                    : request.student?.name || 'Unknown'}
                </p>

                <p><strong>Subject:</strong> {request.subject}</p>
                <p><strong>Requested Time:</strong> {new Date(request.requestedTime).toLocaleString()}</p>
                <Badge className={`badge-${request.status}`}>
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </Badge>
                {userRole === 'TUTOR' && request.status === 'pending' && (
                  <div className="mt-2 space-x-2">
                    <Button onClick={() => handleSessionResponse(request.id, 'accepted')} size="sm">
                      Accept
                    </Button>
                    <Button onClick={() => handleSessionResponse(request.id, 'declined')} variant="outline" size="sm">
                      Decline
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <p>You have {sessions.length} active session{sessions.length !== 1 ? 's' : ''}.</p>
          <Button variant="link" onClick={() => setActiveTab('sessions')}>View all sessions</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p>You have new messages in your sessions.</p>
          <Button variant="link" onClick={() => setActiveTab('sessions')}>Check your sessions</Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderSessions = () => (
    <div>
      <h2 className="text-2xl font-bold mb-4">Session Management</h2>
      {userRole === 'TUTOR' && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="default" className="mb-4">
              <CalendarDays className="mr-2 h-4 w-4" />
              Create New Session
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Create New Session</DialogTitle>
            <DialogDescription>
              Search for students and select them to create a new session.
            </DialogDescription>
            <div className="space-y-4 mt-4">
              <div className="flex space-x-2">
                <Input
                  type="text"
                  placeholder="Search for students"
                  value={sessionSearchQuery}
                  onChange={(e) => setSessionSearchQuery(e.target.value)}
                />
                <Button onClick={handleSessionSearch}>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
              </div>
              {sessionSearchResults.length > 0 && (
                <ScrollArea className="h-[200px] mt-4">
                  {sessionSearchResults.map((student) => (
                    <Card key={student.id} className="mb-2">
                      <CardContent className="flex items-center justify-between py-2">
                        <div className="flex items-center space-x-2">
                          <Avatar>
                            <AvatarImage src="/placeholder-avatar.jpg" />
                            <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span>{student.name}</span>
                        </div>
                        <input
                          type="checkbox"
                          id={`student-${student.id}`}
                          checked={newSessionStudents.includes(student.id)}
                          onChange={(e) => {
                            const selectedId = student.id;
                            if (e.target.checked) {
                              setNewSessionStudents([...newSessionStudents, selectedId]);
                            } else {
                              setNewSessionStudents(newSessionStudents.filter(id => id !== selectedId));
                            }
                          }}
                          className="h-4 w-4"
                        />
                      </CardContent>
                    </Card>
                  ))}
                </ScrollArea>
              )}
              <Button className="w-full" onClick={handleCreateSession}>
                <CalendarDays className="mr-2 h-4 w-4" />
                Create Session
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      <div className="space-y-4">
        {sessions.map(session => (
          <Card key={session.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>
                  {userRole === 'TUTOR'
                    ? `Session with ${session.students.map(s => s.name).join(', ')}`
                    : `Session with ${session.tutor.name}`}
                </span>
                <Badge className={session.status === 'active' ? 'default' : 'secondary'}>
                  {session.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Latest message: {session.messages && session.messages.length > 0
                  ? session.messages[session.messages.length - 1].content
                  : 'No messages yet'}
              </p>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => navigate(`/chat/${session.id}`)}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Open Chat
                </Button>
                {userRole === 'TUTOR' && (
                  <Button variant="destructive" onClick={() => handleDeleteSession(session.id)}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Delete Session
                  </Button>
                )}
                {userRole === 'STUDENT' && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="default" size="sm">
                        <Star className="mr-2 h-4 w-4" />
                        Provide Feedback
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogTitle>Leave Feedback for {session.tutor.name}</DialogTitle>
                      <DialogDescription>
                        Please rate your session with {session.tutor.name}.
                      </DialogDescription>
                      <div className="flex items-center space-x-2 mt-4">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <Button
                            key={rating}
                            variant={feedbackForm.rating === rating ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFeedbackForm({
                              ...feedbackForm,
                              sessionId: session.id.toString(),
                              tutorId: session.tutor.id.toString(),
                              tutorName: session.tutor.name,
                              rating
                            })}
                          >
                            <Star className={`h-4 w-4 ${feedbackForm.rating >= rating ? 'fill-current text-yellow-500' : 'text-gray-400'}`} />
                          </Button>
                        ))}
                      </div>
                      <Textarea
                        placeholder="Comments"
                        value={feedbackForm.comments}
                        onChange={(e) => setFeedbackForm({ ...feedbackForm, comments: e.target.value })}
                        className="mt-4"
                      />
                      <Button
                        onClick={handleFeedbackSubmit}
                        className="mt-4 w-full"
                        disabled={!feedbackForm.rating}
                      >
                        Submit Feedback
                      </Button>
                    </DialogContent>
                  </Dialog>
                )}
                {userRole === 'STUDENT' && session.feedbackProvided && (
                  <Badge className="secondary">Feedback Provided</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderProfile = () => (
    <Card>
      <CardHeader>
        <CardTitle>My Profile</CardTitle>
      </CardHeader>
      <CardContent>
        {profile && (
          <div>
            {isEditing ? (
              <div className="space-y-4">
                <Input
                  type="text"
                  value={editedProfile?.name || ''}
                  onChange={(e) => setEditedProfile({ ...editedProfile!, name: e.target.value })}
                  placeholder="Name"
                />
                <Input
                  type="email"
                  value={editedProfile?.email || ''}
                  onChange={(e) => setEditedProfile({ ...editedProfile!, email: e.target.value })}
                  placeholder="Email"
                />
                {profile.role === 'TUTOR' && (
                  <>
                    <p>
                      <strong>Subjects:</strong>{' '}
                      {profile.subjects && profile.subjects.length > 0
                        ? profile.subjects.map((s) => s.name).join(', ')
                        : 'Not specified'}
                    </p>
                    <p>
                      <strong>Location:</strong> {profile.location || 'Not specified'}
                    </p>
                    <p>
                      <strong>Availability:</strong>{' '}
                      {Array.isArray(profile.availability)
                        ? profile.availability.map((slot: { day: string; time: string }) => (
                          <span key={`${slot.day}-${slot.time}`}>
                            {slot.day}: {slot.time}
                          </span>
                        ))
                        : 'Not specified'}
                    </p>
                  </>
                )}
                {profile.role === 'STUDENT' && (
                  <>
                    <p>
                      <strong>Learning Goals:</strong> {profile.learningGoals || 'Not specified'}
                    </p>
                    <p>
                      <strong>Preferred Subjects:</strong>{' '}
                      {profile.preferredSubjects && profile.preferredSubjects.length > 0
                        ? profile.preferredSubjects.map((s) => s.name).join(', ')
                        : 'Not specified'}
                    </p>
                  </>
                )}
                <div className="space-x-2">
                  <Button onClick={handleSaveProfile}>Save</Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p><strong>Name:</strong> {profile.name}</p>
                <p><strong>Email:</strong> {profile.email}</p>
                <p><strong>Role:</strong> {profile.role}</p>
                {profile.role === 'TUTOR' && (
                  <>
                    <p><strong>Subjects:</strong> {profile.subjects?.map(s => s.name).join(', ')}</p>
                    <p><strong>Location:</strong> {profile.location}</p>
                    <div>
                      <p><strong>Availability:</strong></p>
                      {Array.isArray(profile.availability) ? (
                        profile.availability.map((slot: { day: string; time: string }) => (
                          <p key={`${slot.day}-${slot.time}`} style={{ marginLeft: "1em" }}>
                            {slot.day}: {slot.time}
                          </p>
                        ))
                      ) : (
                        <p>Not specified</p>
                      )}
                    </div>

                  </>
                )}
                {profile.role === 'STUDENT' && (
                  <>
                    <p><strong>Learning Goals:</strong> {profile.learningGoals}</p>
                    <p><strong>Preferred Subjects:</strong> {profile.preferredSubjects?.map(s => s.name).join(', ')}</p>
                  </>
                )}
                <Button variant="outline" onClick={handleEditProfile}>Edit Profile</Button>
              </div>
            )}
            {profile.role === 'TUTOR' && (
              <div className="mt-4">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleUploadDocument}
                  style={{ display: 'none' }}
                  id="upload-document"
                />
                <label htmlFor="upload-document">
                  <Button asChild>
                    <span>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Verification Document
                    </span>
                  </Button>
                </label>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
  const renderSessionCreationDialog = () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default" className="mb-4">
          <CalendarDays className="mr-2 h-4 w-4" />
          Create New Session
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Create New Session</DialogTitle>
        <DialogDescription>
          Search for students and select them to create a new session.
        </DialogDescription>
        <div className="space-y-4 mt-4">
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="Search for students"
              value={sessionSearchQuery}
              onChange={(e) => setSessionSearchQuery(e.target.value)}
            />
            <Button onClick={handleSessionSearch}>
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </div>
          {sessionSearchResults.length > 0 && (
            <ScrollArea className="h-[200px] mt-4">
              {sessionSearchResults.map((student) => (
                <Card key={student.id} className="mb-2">
                  <CardContent className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-2">
                      <span>{student.name}</span>
                    </div>
                    <input
                      type="checkbox"
                      id={`student-${student.id}`}
                      checked={newSessionStudents.includes(student.id)}
                      onChange={(e) => {
                        const selectedId = student.id;
                        if (e.target.checked) {
                          setNewSessionStudents([...newSessionStudents, selectedId]);
                        } else {
                          setNewSessionStudents(newSessionStudents.filter(id => id !== selectedId));
                        }
                      }}
                      className="h-4 w-4"
                    />
                  </CardContent>
                </Card>
              ))}
            </ScrollArea>
          )}
          <Button className="w-full" onClick={handleCreateSession}>
            <CalendarDays className="mr-2 h-4 w-4" />
            Create Session
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  const renderMainSearchResults = () => (
    <div className="mt-4">
      <h3 className="text-xl font-semibold mb-2">Search Results</h3>
      <ScrollArea className="h-[300px]">
        {mainSearchResults.map((result) => (
          <Card key={result.id} className="mb-2">
            <CardContent className="py-2">
              <div className="flex justify-between items-center">
                <div>
                  <p><strong>Name:</strong> {result.name}</p>
                  <p><strong>Email:</strong> {result.email}</p>
                  {result.subjects && <p><strong>Subjects:</strong> {result.subjects.map(s => s.name).join(', ')}</p>}
                </div>
                {userRole === 'STUDENT' && (
                  <Dialog onOpenChange={(open) => {
                    if (!open) {
                      // Reset form when dialog is closed
                      setNewSessionRequest({
                        tutorId: '',
                        subject: '',
                        requestedTime: '',
                        content: '',
                      });
                      setSelectedTutor(null);
                      setIsSubmitting(false);
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSessionRequest(result)}
                      >
                        Request Session
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogTitle>Request Session with {result.name}</DialogTitle>
                      <DialogDescription className="text-muted-foreground">
                        Please provide details for your session request.
                      </DialogDescription>

                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="subject">Subject</Label>
                          <Select
                            value={newSessionRequest.subject}
                            onValueChange={(value) =>
                              setNewSessionRequest({ ...newSessionRequest, subject: value })
                            }
                          >
                            <SelectTrigger className="w-full" id="subject">
                              <SelectValue placeholder="Select a subject" />
                            </SelectTrigger>
                            <SelectContent>
                              {subjects.map((subject) => (
                                <SelectItem key={subject.id} value={subject.name}>
                                  {subject.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="requestedTime">Preferred Time</Label>
                          <Input
                            id="requestedTime"
                            type="datetime-local"
                            min={new Date().toISOString().slice(0, 16)}
                            value={newSessionRequest.requestedTime}
                            onChange={(e) =>
                              setNewSessionRequest({ ...newSessionRequest, requestedTime: e.target.value })
                            }
                          />
                          <p className="text-sm text-muted-foreground">
                            Select your preferred session time
                          </p>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="content">Session Details</Label>
                          <Textarea
                            id="content"
                            placeholder="Describe what you'd like to learn or discuss in this session..."
                            value={newSessionRequest.content}
                            onChange={(e) => setNewSessionRequest({ ...newSessionRequest, content: e.target.value })}
                            className="min-h-[100px]"
                          />
                        </div>
                      </div>

                      <DialogFooter>
                        <Button
                          onClick={submitSessionRequest}
                          disabled={isSubmitting}
                          className="w-full"
                        >
                          {isSubmitting ? (
                            <div className="flex items-center justify-center">
                              <span className="mr-2">Sending Request...</span>
                            </div>
                          ) : (
                            'Send Session Request'
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </ScrollArea>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      <Toaster position="top-right" />
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4">
          <div className="flex items-center space-x-4 mb-6">
            <Avatar>
              <AvatarImage src="/placeholder-avatar.jpg" />
              <AvatarFallback>{profile?.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold">{profile?.name}</h2>
              <p className="text-sm text-gray-500">{profile?.role}</p>
            </div>
          </div>
          <nav>
            <ul className="space-y-2">
              <li>
                <Button variant="ghost" className="w-full justify-start" onClick={() => setActiveTab('overview')}>
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Overview
                </Button>
              </li>
              <li>
                <Button variant="ghost" className="w-full justify-start" onClick={() => setActiveTab('sessions')}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Sessions
                </Button>
              </li>
              <li>
                <Button variant="ghost" className="w-full justify-start" onClick={() => setActiveTab('profile')}>
                  <User className="mr-2 h-4 w-4" />
                  My Profile
                </Button>
              </li>
            </ul>
          </nav>
        </div>
        <div className="absolute bottom-4 left-4">
          <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-red-500">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

        {/* Search bar */}
        <div className="mb-6 flex">
          <Input
            type="text"
            placeholder={`Search for ${userRole === 'STUDENT' ? 'tutors' : 'students'}`}
            value={mainSearchQuery}
            onChange={(e) => setMainSearchQuery(e.target.value)}
            className="mr-2"
          />
          <Button onClick={handleMainSearch}>
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
        </div>

        {/* Search results */}
        {mainSearchResults.length > 0 && renderMainSearchResults()}

        {/* Dashboard content */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'sessions' && (
          <>
            {userRole === 'TUTOR' && renderSessionCreationDialog()}
            {renderSessions()}
          </>
        )}
        {activeTab === 'profile' && renderProfile()}
        {renderSessionRequests()}
      </div>
    </div>
  );
};

export default Dashboard;