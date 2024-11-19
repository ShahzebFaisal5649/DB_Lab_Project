import React, { useState, useEffect } from 'react'
import { Button } from "./ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Input } from './ui/input'
import { Check, X, Eye, Search, Plus } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog"
import { Badge } from "./ui/badge"

interface User {
  [x: string]: any;
  id: string;
  name: string;
  email: string;
  role: string;
  verificationStatus?: string;
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

const statusColors = {
  pending: "bg-yellow-200 text-yellow-800",
  approved: "bg-green-200 text-green-800",
  rejected: "bg-red-200 text-red-800",
}


const AdminDashboard: React.FC = () => {
  const [tutors, setTutors] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [sessionRequests, setSessionRequests] = useState<SessionRequest[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newSubject, setNewSubject] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('')

  useEffect(() => {
    fetchTutors();
    fetchStudents();
    fetchSessionRequests();
    fetchFeedbacks();
    fetchSubjects();
  }, []);

  const fetchTutors = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch('http://localhost:5000/api/users/admin/users?role=TUTOR', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'user-id': userId ?? '',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setTutors(data.users);
      } else {
        console.error('Failed to fetch tutors');
      }
    } catch (error) {
      console.error('Error fetching tutors:', error);
    }
  };
  
  const fetchStudents = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch('http://localhost:5000/api/users/admin/users?role=STUDENT', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'user-id': userId ?? '',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setStudents(data.users);
      } else {
        console.error('Failed to fetch students');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };
  
  const fetchSessionRequests = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const role = localStorage.getItem('userRole');
      if (!userId || !role) {
        console.error('Role and userId are required');
        alert("Role or User ID missing. Please log in again.");
        return;
      }
  
      const response = await fetch(`http://localhost:5000/api/users/session-requests?role=${role}&userId=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'user-id': userId,
        },
      });
  
      if (response.ok) {
        const data = await response.json();
        setSessionRequests(data.requests);
      } else {
        console.error('Failed to fetch session requests');
      }
    } catch (error) {
      console.error('Error fetching session requests:', error);
    }
  };
    

  const fetchFeedbacks = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch('http://localhost:5000/api/users/feedbacks', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'user-id': userId ?? '',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setFeedbacks(data.feedbacks);
      } else {
        console.error('Failed to fetch feedbacks');
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
    }
  };
  

  const handleVerify = async (userId: string, isVerified: boolean) => {
    try {
      const authUserId = localStorage.getItem('userId');
      const response = await fetch(`http://localhost:5000/api/users/admin/users/${userId}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'user-id': authUserId ?? '',
        },
        body: JSON.stringify({ isVerified }),
      });
  
      if (response.ok) {
        setTutors(prevTutors =>
          prevTutors.map(tutor =>
            tutor.id === userId ? { ...tutor, isVerified } : tutor
          )
        ); // Update the specific tutor's verification status in state
      } else {
        const errorData = await response.json();
        console.error('Failed to update user verification status:', errorData.message);
      }
    } catch (error) {
      console.error('Error updating user verification status:', error);
    }
  };
  
  const viewVerificationDocument = (userId: string) => {
    const authUserId = localStorage.getItem('userId');
    const url = `http://localhost:5000/api/users/admin/verification-document/${userId}`;
    
    fetch(url, {
      method: 'GET',
      headers: {
        'user-id': authUserId ?? '',
      },
    })
      .then(response => {
        if (response.ok) {
          return response.blob();
        }
        throw new Error('Network response was not ok.');
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
      })
      .catch(error => {
        console.error('Error:', error);
        // Handle the error appropriately
      });
  };
  
  const fetchSubjects = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch('http://localhost:5000/api/users/subjects', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'user-id': userId ?? '',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSubjects(data.subjects);
      } else {
        console.error('Failed to fetch subjects');
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };  

  const addSubject = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch('http://localhost:5000/api/users/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': userId ?? '',
        },
        body: JSON.stringify({ name: newSubject }),
      });
      if (response.ok) {
        setNewSubject('');
        fetchSubjects(); // Refresh subject list
      } else {
        console.error('Failed to add subject');
      }
    } catch (error) {
      console.error('Error adding subject:', error);
    }
  };
  

  const deleteSubject = async (subjectId: string) => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`http://localhost:5000/api/users/subjects/${subjectId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'user-id': userId ?? '',
        },
      });
      if (response.ok) {
        fetchSubjects(); // Refresh subject list
      } else {
        console.error('Failed to delete subject');
      }
    } catch (error) {
      console.error('Error deleting subject:', error);
    }
  };  

  const filteredTutors = tutors.filter(tutor =>
    tutor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tutor.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-primary">Admin Dashboard</h1>
      <Tabs defaultValue="tutors" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="tutors">Tutors</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="feedbacks">Feedbacks</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
        </TabsList>
        <TabsContent value="tutors">
          <Card>
            <CardHeader>
              <CardTitle>Tutors</CardTitle>
              <CardDescription>Manage and verify tutors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tutors..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTutors.map((tutor) => (
                    <TableRow key={tutor.id}>
                      <TableCell>{tutor.name}</TableCell>
                      <TableCell>{tutor.email}</TableCell>
                      <TableCell>
                        <Badge variant={tutor.isVerified ? "success" : "secondary"}>
                          {tutor.isVerified ? "Verified" : "Not Verified"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button size="sm" onClick={() => handleVerify(tutor.id, true)}>
                            <Check className="mr-2 h-4 w-4" />
                            Verify
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleVerify(tutor.id, false)}>
                            <X className="mr-2 h-4 w-4" />
                            Unverify
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => viewVerificationDocument(tutor.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Document
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Students</CardTitle>
              <CardDescription>View registered students</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.email}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Session Requests</CardTitle>
              <CardDescription>View all session requests</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Tutor</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Requested Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessionRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{request.student.name}</TableCell>
                      <TableCell>{request.tutor.name}</TableCell>
                      <TableCell>{request.subject}</TableCell>
                      <TableCell>{new Date(request.requestedTime).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[request.status.toLowerCase() as keyof typeof statusColors]}>
                          {request.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="feedbacks">
          <Card>
            <CardHeader>
              <CardTitle>Feedbacks</CardTitle>
              <CardDescription>View all feedbacks</CardDescription>
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
                  {feedbacks.map((feedback) => (
                    <TableRow key={feedback.id}>
                      <TableCell>{feedback.from.name} ({feedback.from.role})</TableCell>
                      <TableCell>{feedback.to.name} ({feedback.to.role})</TableCell>
                      <TableCell>{feedback.rating}</TableCell>
                      <TableCell>{feedback.comments}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="subjects">
          <Card>
            <CardHeader>
              <CardTitle>Subjects</CardTitle>
              <CardDescription>Manage subjects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Subject
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Subject</DialogTitle>
                      <DialogDescription>Enter the name of the new subject below.</DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center space-x-2">
                      <Input
                        placeholder="New subject"
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                      />
                      <Button onClick={addSubject}>Add</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject Name</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.map((subject) => (
                    <TableRow key={subject.id}>
                      <TableCell>{subject.name}</TableCell>
                      <TableCell>
                        <Button variant="destructive" size="sm" onClick={() => deleteSubject(subject.id)}>Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdminDashboard;