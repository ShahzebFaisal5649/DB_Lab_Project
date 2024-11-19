const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const { isAdmin } = require('../middleware/auth');
const multer = require('multer');

// Set up multer for file uploads (Verification Document)
const upload = multer({
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(pdf)$/)) {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  },
});

// Registration Route
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      subjects,
      location,
      availability,
      learningGoals,
      preferredSubjects,
    } = req.body;

    const validRoles = ['STUDENT', 'TUTOR', 'ADMIN'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let userData = {
      name,
      email,
      password: hashedPassword,
      role,
    };

    if (role === 'STUDENT') {
      userData.student = {
        create: {
          learningGoals,
          preferredSubjects: {
            connectOrCreate: preferredSubjects?.map((subject) => ({
              where: { name: subject },
              create: { name: subject },
            })),
          },
        },
      };
    } else if (role === 'TUTOR') {
      userData.tutor = {
        create: {
          location,
          availability,
          subjects: {
            connectOrCreate: subjects?.map((subject) => ({
              where: { name: subject },
              create: { name: subject },
            })),
          },
        },
      };
    } else if (role === 'ADMIN') {
      userData.admin = { create: {} };
    }

    const user = await prisma.user.create({
      data: userData,
    });

    res.status(201).json({ message: 'User registered successfully', userId: user.id });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
});


// Login Route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        role: user.role,
        name: user.name,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// Admin: Evaluate Tutor Career Status
router.post('/admin/evaluate-tutor/:tutorId', isAdmin, async (req, res) => {
  const { tutorId } = req.params;
  const { evaluationResult } = req.body;

  try {
    const tutor = await prisma.tutor.findUnique({
      where: { userId: parseInt(tutorId) },
    });

    if (!tutor) {
      return res.status(404).json({ message: 'Tutor not found' });
    }

    const updatedTutor = await prisma.tutor.update({
      where: { userId: parseInt(tutorId) },
      data: { careerStatus: evaluationResult },
    });

    res.status(200).json({ message: `Tutor evaluation completed: ${updatedTutor.careerStatus}` });
  } catch (error) {
    res.status(500).json({ message: 'Error evaluating tutor', error: error.message });
  }
});

// Get User Profile
router.get('/profile/:id', async (req, res) => {
  const userId = parseInt(req.params.id);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: {
          include: {
            preferredSubjects: true,
          },
        },
        tutor: {
          include: {
            subjects: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});


// Update User Profile
router.put('/profile/:id', async (req, res) => {
  try {
    const { name, subjects, location, availability, learningGoals, preferredSubjects } = req.body;
    const userId = parseInt(req.params.id);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let updateData = { name };

    if (user.role === 'TUTOR') {
      updateData.tutor = {
        update: {
          location,
          availability,
          subjects: {
            set: [],
            connectOrCreate: subjects?.map((subject) => ({
              where: { name: subject },
              create: { name: subject },
            })),
          },
        },
      };
    } else if (user.role === 'STUDENT') {
      updateData.student = {
        update: {
          learningGoals,
          preferredSubjects: {
            set: [],
            connectOrCreate: preferredSubjects?.map((subject) => ({
              where: { name: subject },
              create: { name: subject },
            })),
          },
        },
      };
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        student: { include: { preferredSubjects: true } },
        tutor: { include: { subjects: true } },
      },
    });

    res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

// Upload Verification Document
router.post('/upload-verification/:id', upload.single('document'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const documentBuffer = req.file.buffer;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== 'TUTOR') {
      return res.status(400).json({ message: 'Invalid user or user is not a tutor' });
    }

    await prisma.tutor.update({
      where: { userId },
      data: { verificationDocument: documentBuffer },
    });

    res.status(200).json({ message: 'Verification document uploaded successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading document', error: error.message });
  }
});

// Session Request Route
router.post('/session/request', async (req, res) => {
  try {
    const { studentId, tutorId, subject, content, requestedTime } = req.body;

    const student = await prisma.student.findUnique({ where: { userId: parseInt(studentId) } });
    const tutor = await prisma.tutor.findUnique({ where: { userId: parseInt(tutorId) } });
    const subjectEntity = await prisma.subject.findUnique({ where: { name: subject } });

    if (!student) {
      return res.status(400).json({ message: 'Invalid student ID' });
    }
    if (!tutor) {
      return res.status(400).json({ message: 'Invalid tutor ID' });
    }
    if (!subjectEntity) {
      return res.status(400).json({ message: 'Subject not found' });
    }

    const sessionRequest = await prisma.sessionRequest.create({
      data: {
        student: { connect: { userId: parseInt(studentId) } },
        tutor: { connect: { userId: parseInt(tutorId) } },
        subject: { connect: { id: subjectEntity.id } },
        content,
        requestedTime: new Date(requestedTime),
        status: 'pending',
      },
    });

    res.status(201).json({ message: 'Session request sent successfully', sessionRequestId: sessionRequest.id });
  } catch (error) {
    console.error('Error sending session request:', error);
    res.status(500).json({ message: 'Error sending session request', error: error.message });
  }
});

// Tutor Respond to Session Request
// Tutor Respond to Session Request
router.put('/session/:id/respond', async (req, res) => {
  try {
    const { status } = req.body;
    const sessionRequestId = parseInt(req.params.id);

    // First, fetch the session request with all necessary relations
    const sessionRequest = await prisma.sessionRequest.findUnique({
      where: { id: sessionRequestId },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        tutor: {
          include: {
            user: true,
          },
        },
        subject: true,
      },
    });

    if (!sessionRequest) {
      return res.status(404).json({ message: 'Session request not found' });
    }

    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    // Update the session request status
    const updatedSessionRequest = await prisma.sessionRequest.update({
      where: { id: sessionRequestId },
      data: { status },
    });

    // If accepted, create a new session
    let newSession = null;
    if (status === 'accepted') {
      try {
        // Create the session
        newSession = await prisma.session.create({
          data: {
            tutorId: sessionRequest.tutorId,
            students: {
              connect: [{ id: sessionRequest.studentId }]
            },
            sessionRequestId: sessionRequestId // Using sessionRequestId instead of sessionRequest
          },
          include: {
            tutor: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            students: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            messages: true,
            sessionRequest: true
          },
        });

        // Format the session data for the frontend
        const formattedSession = {
          id: newSession.id,
          tutor: {
            id: newSession.tutor.user.id,
            name: newSession.tutor.user.name,
          },
          students: newSession.students.map(student => ({
            id: student.user.id,
            name: student.user.name,
          })),
          messages: [],
          status: 'active'
        };

        return res.status(200).json({
          message: 'Session request accepted and session created',
          sessionRequest: updatedSessionRequest,
          session: formattedSession
        });
      } catch (createError) {
        console.error('Error creating session:', createError);
        return res.status(500).json({
          message: 'Session request accepted but failed to create session',
          error: createError.message
        });
      }
    }

    // If declined, just return the updated request
    return res.status(200).json({
      message: 'Session request declined',
      sessionRequest: updatedSessionRequest
    });

  } catch (error) {
    console.error('Error responding to session request:', error);
    res.status(500).json({ 
      message: 'Error responding to session request', 
      error: error.message 
    });
  }
});
// Feedback Route
// Feedback Route
router.post('/session/:id/feedback', async (req, res) => {
  try {
    const { rating, comments, fromId } = req.body;
    const sessionId = parseInt(req.params.id);

    // Find the session with all necessary relations
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        tutor: {
          include: {
            user: true // Include the tutor's user information
          }
        },
        sessionRequest: {
          include: {
            feedback: true
          }
        }
      }
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (!session.sessionRequestId) {
      return res.status(400).json({ message: 'No session request found for this session' });
    }

    if (session.sessionRequest?.feedback) {
      return res.status(400).json({ message: 'Feedback already exists for this session' });
    }

    // Use the tutor's user ID
    const tutorUserId = session.tutor.user.id;

    // Create the feedback
    const feedback = await prisma.feedback.create({
      data: {
        sessionRequestId: session.sessionRequestId,
        fromId: parseInt(fromId),
        toId: tutorUserId, // Use the tutor's user ID
        rating: parseInt(rating),
        comments: comments || '',
      },
    });

    res.status(201).json({ 
      message: 'Feedback submitted successfully', 
      feedback 
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ 
      message: 'Error submitting feedback', 
      error: error.message 
    });
  }
});

// Search Users
router.get('/search', async (req, res) => {
  try {
    const { query, role } = req.query;

    // Ensure that query and role are provided
    if (!query || !role) {
      return res.status(400).json({ message: 'Query and role are required' });
    }

    const searchQuery = query.toLowerCase();
    let searchConditions = {};

    if (role.toLowerCase() === 'student') {
      // Students searching for tutors
      searchConditions = {
        role: 'TUTOR',
        OR: [
          { 
            name: {
              contains: searchQuery
            }
          },
          {
            tutor: {
              subjects: {
                some: {
                  name: {
                    contains: searchQuery
                  }
                }
              }
            }
          }
        ],
      };
    } else if (role.toLowerCase() === 'tutor') {
      // Tutors searching for students
      searchConditions = {
        role: 'STUDENT',
        OR: [
          { 
            name: {
              contains: searchQuery
            }
          },
          {
            student: {
              preferredSubjects: {
                some: {
                  name: {
                    contains: searchQuery
                  }
                }
              }
            }
          }
        ],
      };
    } else {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    // Perform the search with proper includes
    const searchResults = await prisma.user.findMany({
      where: searchConditions,
      include: {
        tutor: {
          include: {
            subjects: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        student: {
          include: {
            preferredSubjects: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    // Clean up sensitive data before sending response
    const cleanedResults = searchResults.map(user => {
      const { password, ...cleanUser } = user;
      return cleanUser;
    });

    res.status(200).json({ results: cleanedResults });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Error searching users', error: error.message });
  }
});

// Fetch session requests
router.get('/session-requests', async (req, res) => {
  const { role, userId } = req.query;
  try {
    let sessionRequests;

    if (role === 'ADMIN') {
      console.log('Fetching all session requests as ADMIN');
      // Admin sees all session requests
      sessionRequests = await prisma.sessionRequest.findMany({
        include: {
          student: { include: { user: true } },
          tutor: { include: { user: true } },
          subject: true,
        },
      });
    } else if (role === 'STUDENT') {
      console.log('Fetching session requests for STUDENT');
      // Students see only their requests
      sessionRequests = await prisma.sessionRequest.findMany({
        where: { student: { userId: parseInt(userId) } },
        include: {
          tutor: { include: { user: true } },
          subject: true,
        },
      });
    } else if (role === 'TUTOR') {
      console.log('Fetching session requests for TUTOR');
      // Tutors see only their requests
      sessionRequests = await prisma.sessionRequest.findMany({
        where: { tutor: { userId: parseInt(userId) } },
        include: {
          student: { include: { user: true } },
          subject: true,
        },
      });
    } else {
      console.log('Invalid user role');
      return res.status(400).json({ message: 'Invalid user role' });
    }

    // Format the session requests
    const formattedRequests = sessionRequests.map((request) => ({
      id: request.id,
      student: request.student
        ? { id: request.student.userId, name: request.student.user.name }
        : null,
      tutor: request.tutor
        ? { id: request.tutor.userId, name: request.tutor.user.name }
        : null,
      subject: request.subject.name,
      requestedTime: request.requestedTime,
      status: request.status,
    }));

    return res.status(200).json({ requests: formattedRequests });
  } catch (error) {
    console.error('Error fetching session requests:', error);
    res.status(500).json({ message: 'Error fetching session requests', error: error.message });
  }
});

// Get Messages for a Session
router.get('/sessions/:sessionId/messages', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const messages = await prisma.message.findMany({
      where: { sessionId: parseInt(sessionId) },
      include: { sender: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    });

    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      senderId: msg.sender.id,
      senderName: msg.sender.name,
      createdAt: msg.createdAt,
    }));
    res.status(200).json(formattedMessages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
});

// Get users by role (TUTORS or STUDENTS)
router.get('/admin/users', isAdmin, async (req, res) => {
  const { role } = req.query;
  try {
    if (!role || !['TUTOR', 'STUDENT'].includes(role.toUpperCase())) {
      return res.status(400).json({ message: 'Invalid or missing role parameter' });
    }

    const users = await prisma.user.findMany({
      where: { role: role.toUpperCase() },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    res.status(200).json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});


// Get All Subjects
router.get('/subjects', async (req, res) => {
  try {
    const subjects = await prisma.subject.findMany({
      select: {
        id: true,
        name: true,
      },
    });
    res.status(200).json({ subjects });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ message: 'Error fetching subjects', error: error.message });
  }
});

// GET /sessions/:userId - Get sessions for a user
router.get('/sessions/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId);
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: true,
        tutor: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let sessions;

    if (user.role === 'TUTOR') {
      sessions = await prisma.session.findMany({
        where: { tutorId: user.tutor.id },
        include: {
          tutor: { select: { id: true, user: { select: { name: true } } } },
          students: { select: { user: { select: { id: true, name: true } } } },
          messages: true,
          sessionRequest: true,
        },
      });
    } else if (user.role === 'STUDENT') {
      sessions = await prisma.session.findMany({
        where: {
          students: {
            some: { userId: user.student.userId },
          },
        },
        include: {
          tutor: { select: { id: true, user: { select: { name: true } } } },
          students: { select: { user: { select: { id: true, name: true } } } },
          messages: true,
          sessionRequest: true,
        },
      });
    } else {
      return res.status(400).json({ message: 'Invalid user role' });
    }

    // Format sessions to include necessary data
    const formattedSessions = sessions.map((session) => ({
      id: session.id,
      tutor: {
        id: session.tutor.id,
        name: session.tutor.user.name,
      },
      students: session.students.map((student) => ({
        id: student.user.id,
        name: student.user.name,
      })),
      messages: session.messages,
      feedbackProvided: false, // Update this based on your logic
    }));

    res.status(200).json(formattedSessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ message: 'Error fetching sessions', error: error.message });
  }
});


// POST /sessions - Create a session
router.post('/sessions', async (req, res) => {
  try {
    const { tutorId, studentIds } = req.body;

    if (!tutorId || !studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({ message: 'tutorId and studentIds are required' });
    }

    // Check if tutor exists
    const tutor = await prisma.tutor.findUnique({ where: { userId: parseInt(tutorId) } });
    if (!tutor) {
      return res.status(404).json({ message: 'Tutor not found' });
    }

    // Check if all students exist
    const students = await prisma.student.findMany({
      where: { userId: { in: studentIds.map((id) => parseInt(id)) } },
    });

    if (students.length !== studentIds.length) {
      return res.status(404).json({ message: 'One or more students not found' });
    }

    // Create the session
    const session = await prisma.session.create({
      data: {
        tutor: { connect: { userId: parseInt(tutorId) } },
        students: {
          connect: studentIds.map((id) => ({ id: parseInt(id) })),
        },
      },
      include: {
        tutor: { select: { id: true, user: { select: { name: true } } } },
        students: { select: { id: true, user: { select: { name: true } } } },
        messages: true,
        sessionRequest: true,
      },
    });

    res.status(201).json(session);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ message: 'Error creating session', error: error.message });
  }
});

// DELETE /sessions/:id - Delete a session
router.delete('/sessions/:id', async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);

    // Check if the session exists
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Delete related messages associated with this session
    await prisma.message.deleteMany({
      where: { sessionId },
    });

    // Update session requests to nullify the sessionId field, if necessary
    await prisma.sessionRequest.updateMany({
      where: { sessionId },
      data: { sessionId: null }, // Nullify the sessionId to prevent FK constraints
    });

    // Now delete the session itself
    await prisma.session.delete({
      where: { id: sessionId },
    });

    res.status(200).json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ message: 'Error deleting session', error: error.message });
  }
});


// Get current user information
router.get('/current', async (req, res) => {
  try {
    const userIdHeader = req.headers['user-id'];
    const userId = parseInt(userIdHeader);

    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: {
          include: {
            preferredSubjects: true,
          },
        },
        tutor: {
          include: {
            subjects: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Error fetching current user:', error);
    res
      .status(500)
      .json({ message: 'Error fetching current user', error: error.message });
  }
});

router.get('/feedbacks', isAdmin, async (req, res) => {
  try {
    const feedbacks = await prisma.feedback.findMany({
      include: {
        from: true,
        to: true,
        session: {
          include: { subject: true },
        },
      },
    });
    res.status(200).json({ feedbacks });
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    res.status(500).json({ message: 'Error fetching feedbacks', error: error.message });
  }
});

router.post('/subjects', isAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    const newSubject = await prisma.subject.create({
      data: { name },
    });
    res.status(201).json({ message: 'Subject added successfully', subject: newSubject });
  } catch (error) {
    console.error('Error adding subject:', error);
    res.status(500).json({ message: 'Error adding subject', error: error.message });
  }
});

// DELETE a subject by ID (Admin only)
router.delete('/subjects/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.subject.delete({
      where: { id: parseInt(id) },
    });
    res.status(200).json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Error deleting subject:', error);
    res.status(500).json({ message: 'Error deleting subject', error: error.message });
  }
});

router.put('/admin/users/:userId/verify', isAdmin, async (req, res) => {
  const { userId } = req.params;
  const { isVerified } = req.body;

  try {
    // Check if the user is a tutor since verification applies to tutors
    const tutor = await prisma.tutor.findUnique({
      where: { userId: parseInt(userId) },
    });

    if (!tutor) {
      return res.status(404).json({ message: 'Tutor not found' });
    }

    // Update the verification status
    const updatedTutor = await prisma.tutor.update({
      where: { userId: parseInt(userId) },
      data: { isVerified },
    });

    res.status(200).json({ message: `User verification status updated to: ${updatedTutor.isVerified}` });
  } catch (error) {
    console.error('Error updating user verification status:', error);
    res.status(500).json({ message: 'Error updating verification status', error: error.message });
  }
});

// Get Verification Document by Tutor User ID
router.get('/admin/verification-document/:id', isAdmin, async (req, res) => {
  const tutorId = parseInt(req.params.id);
  try {
    const tutor = await prisma.tutor.findUnique({
      where: { userId: tutorId },
      select: { verificationDocument: true },
    });

    if (!tutor || !tutor.verificationDocument) {
      return res.status(404).json({ message: 'Verification document not found' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.send(tutor.verificationDocument);
  } catch (error) {
    console.error('Error fetching verification document:', error);
    res.status(500).json({ message: 'Error fetching verification document', error: error.message });
  }
});

module.exports = router;