// server/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const multer = require('multer');
const { pool } = require('../dbUtils');
const { isAdmin } = require('../middleware/auth');

// Multer configuration
const upload = multer({
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(pdf)$/)) {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  },
});

// =============== AUTHENTICATION & USER MANAGEMENT ===============
router.get('/admin/users', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { role } = req.query;

    if (!role || !['TUTOR', 'STUDENT'].includes(role.toUpperCase())) {
      return res.status(400).json({ message: 'Invalid or missing role parameter' });
    }

    let sql, params;
    if (role.toUpperCase() === 'TUTOR') {
      sql = `
        SELECT 
          u.id, u.name, u.email, u.role,
          t.isVerified, t.careerStatus,
          GROUP_CONCAT(DISTINCT s.name) as subjects
        FROM User u
        JOIN Tutor t ON u.id = t.userId
        LEFT JOIN _TutorSubjects ts ON t.id = ts.A
        LEFT JOIN Subject s ON ts.B = s.id
        WHERE u.role = ?
        GROUP BY u.id
      `;
    } else {
      sql = `
        SELECT 
          u.id, u.name, u.email, u.role,
          s.learningGoals,
          GROUP_CONCAT(DISTINCT sub.name) as preferredSubjects
        FROM User u
        JOIN Student s ON u.id = s.userId
        LEFT JOIN _StudentPreferredSubjects sps ON s.id = sps.A
        LEFT JOIN Subject sub ON sps.B = sub.id
        WHERE u.role = ?
        GROUP BY u.id
      `;
    }
    params = [role.toUpperCase()];

    const [users] = await conn.execute(sql, params);

    // Format the results
    const formattedUsers = users.map(user => ({
      ...user,
      subjects: user.subjects ? user.subjects.split(',') : [],
      preferredSubjects: user.preferredSubjects ? user.preferredSubjects.split(',') : []
    }));

    res.status(200).json({ users: formattedUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  } finally {
    conn.release();
  }
});
// Add these routes to userRoutes.js

// Verify/Unverify tutor
router.put('/admin/users/:userId/verify', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { userId } = req.params;
    const { isVerified } = req.body;
    
    // First check if user exists and is a tutor
    const [tutors] = await conn.execute(`
      SELECT t.id 
      FROM Tutor t 
      JOIN User u ON t.userId = u.id 
      WHERE u.id = ? AND u.role = 'TUTOR'`,
      [userId]
    );

    if (tutors.length === 0) {
      return res.status(404).json({ message: 'Tutor not found' });
    }

    // Update verification status
    await conn.execute(
      'UPDATE Tutor SET isVerified = ? WHERE userId = ?',
      [isVerified, userId]
    );

    res.status(200).json({ 
      message: `Tutor ${isVerified ? 'verified' : 'unverified'} successfully`,
      userId,
      isVerified
    });
  } catch (error) {
    console.error('Error updating verification status:', error);
    res.status(500).json({ message: 'Error updating verification status' });
  } finally {
    conn.release();
  }
});

// Get verification document
router.get('/admin/verification-document/:id', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const userId = parseInt(req.params.id);

    // Get document data directly from Tutor table
    const [tutors] = await conn.execute(
      'SELECT verificationDocument FROM Tutor WHERE userId = ?',
      [userId]
    );

    if (tutors.length === 0 || !tutors[0].verificationDocument) {
      return res.status(404).json({ message: 'Verification document not found' });
    }

    // Set headers and send document
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="verification_document.pdf"');
    res.send(tutors[0].verificationDocument);
  } catch (error) {
    console.error('Error fetching verification document:', error);
    res.status(500).json({ message: 'Error fetching verification document', error: error.message });
  } finally {
    conn.release();
  }
});

// Upload verification document
router.post('/upload-verification/:userId', upload.single('document'), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const userId = parseInt(req.params.userId);
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Update document in Tutor table
    const [result] = await conn.execute(
      'UPDATE Tutor SET verificationDocument = ? WHERE userId = ?',
      [file.buffer, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Tutor not found' });
    }

    res.status(200).json({ message: 'Document uploaded successfully' });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ message: 'Error uploading document', error: error.message });
  } finally {
    conn.release();
  }
});

// Login Route
router.post('/login', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { email, password } = req.body;
    
    const [users] = await conn.execute(
      'SELECT * FROM `User` WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const user = users[0];
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
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Error logging in', error: error.message });
  } finally {
    conn.release();
  }
});

// Registration Route
router.post('/register', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const {
      name,
      email,
      password,
      role,
      subjects = [],
      location,
      availability,
      learningGoals,
      preferredSubjects = [],
    } = req.body;

    // Validate role
    const validRoles = ['STUDENT', 'TUTOR', 'ADMIN'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    // Check if email exists
    const [existingUser] = await conn.execute(
      'SELECT id FROM `User` WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const [userResult] = await conn.execute(
      'INSERT INTO `User` (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role]
    );
    const userId = userResult.insertId;

    // Handle role-specific data
    if (role === 'STUDENT') {
      const [studentResult] = await conn.execute(
        'INSERT INTO `Student` (userId, learningGoals) VALUES (?, ?)',
        [userId, learningGoals || null]
      );
      
      const studentId = studentResult.insertId;

      // Handle preferred subjects
      for (const subjectName of preferredSubjects) {
        let [subjectResult] = await conn.execute(
          'SELECT id FROM `Subject` WHERE name = ?',
          [subjectName]
        );

        let subjectId;
        if (subjectResult.length === 0) {
          const [newSubject] = await conn.execute(
            'INSERT INTO `Subject` (name) VALUES (?)',
            [subjectName]
          );
          subjectId = newSubject.insertId;
        } else {
          subjectId = subjectResult[0].id;
        }

        await conn.execute(
          'INSERT INTO `_StudentPreferredSubjects` (A, B) VALUES (?, ?)',
          [studentId, subjectId]
        );
      }
    } else if (role === 'TUTOR') {
      const [tutorResult] = await conn.execute(
        'INSERT INTO `Tutor` (userId, location, availability) VALUES (?, ?, ?)',
        [userId, location || null, JSON.stringify(availability) || null]
      );
      
      const tutorId = tutorResult.insertId;

      // Handle tutor subjects
      for (const subjectName of subjects) {
        let [subjectResult] = await conn.execute(
          'SELECT id FROM `Subject` WHERE name = ?',
          [subjectName]
        );

        let subjectId;
        if (subjectResult.length === 0) {
          const [newSubject] = await conn.execute(
            'INSERT INTO `Subject` (name) VALUES (?)',
            [subjectName]
          );
          subjectId = newSubject.insertId;
        } else {
          subjectId = subjectResult[0].id;
        }

        await conn.execute(
          'INSERT INTO `_TutorSubjects` (A, B) VALUES (?, ?)',
          [tutorId, subjectId]
        );
      }
    }

    await conn.commit();
    res.status(201).json({ message: 'User registered successfully', userId });
  } catch (error) {
    await conn.rollback();
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Error registering user', error: error.message });
  } finally {
    conn.release();
  }
});

// Get Profile
// userRoutes.js - Updated profile route
router.get('/profile/:id', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const userId = parseInt(req.params.id);

    // Get base user info with tutor/student data
    const [users] = await conn.execute(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        t.id as tutorId,
        t.location,
        t.availability,
        t.isVerified,
        t.careerStatus,
        s.id as studentId,
        s.learningGoals
      FROM User u
      LEFT JOIN Tutor t ON u.id = t.userId
      LEFT JOIN Student s ON u.id = s.userId
      WHERE u.id = ?
    `, [userId]);

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = { ...users[0] };

    if (user.role === 'TUTOR') {
      // Get tutor's subjects
      const [subjects] = await conn.execute(`
        SELECT DISTINCT s.name
        FROM Subject s
        JOIN _TutorSubjects ts ON s.id = ts.B
        JOIN Tutor t ON ts.A = t.id
        WHERE t.id = ?
      `, [user.tutorId]);

      // Handle availability - it's already an object from MySQL
      let availability = user.availability;
      if (typeof availability === 'string') {
        try {
          availability = JSON.parse(availability);
        } catch (error) {
          console.error('Error parsing availability string:', error);
          availability = [];
        }
      } else if (!Array.isArray(availability)) {
        // If it's neither a string nor an array, set to empty array
        availability = [];
      }

      // Format tutor data
      const formattedUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location || null,
        availability: availability,
        isVerified: Boolean(user.isVerified),
        careerStatus: user.careerStatus || null,
        subjects: subjects.map(s => ({ name: s.name }))
      };

      // Log the formatted data for debugging
      console.log('Formatted tutor data:', JSON.stringify(formattedUser, null, 2));

      res.status(200).json({ user: formattedUser });
    } else if (user.role === 'STUDENT') {
      // Get student's preferred subjects
      const [preferredSubjects] = await conn.execute(`
        SELECT DISTINCT s.name
        FROM Subject s
        JOIN _StudentPreferredSubjects sps ON s.id = sps.B
        JOIN Student st ON sps.A = st.id
        WHERE st.id = ?
      `, [user.studentId]);

      // Format student data
      const formattedUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        learningGoals: user.learningGoals || null,
        preferredSubjects: preferredSubjects.map(s => ({ name: s.name }))
      };

      res.status(200).json({ user: formattedUser });
    } else {
      // Handle other roles (like ADMIN)
      const formattedUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      };

      res.status(200).json({ user: formattedUser });
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  } finally {
    conn.release();
  }
});

// Add a helper route to check the data types
router.get('/debug/tutor/:id', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const userId = parseInt(req.params.id);
    
    const [rawData] = await conn.execute(`
      SELECT 
        t.*,
        u.name,
        u.email,
        u.role
      FROM Tutor t
      JOIN User u ON t.userId = u.id
      WHERE u.id = ?
    `, [userId]);

    if (rawData.length > 0) {
      const tutorData = rawData[0];
      res.status(200).json({ 
        rawData: tutorData,
        availabilityType: typeof tutorData.availability,
        isArray: Array.isArray(tutorData.availability),
        availability: tutorData.availability,
      });
    } else {
      res.status(404).json({ message: 'Tutor not found' });
    }
  } catch (error) {
    console.error('Error in debug route:', error);
    res.status(500).json({ message: 'Error in debug route', error: error.message });
  } finally {
    conn.release();
  }
});

// Update Profile
router.put('/profile/:id', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const userId = parseInt(req.params.id);
    const { name, subjects, location, availability, learningGoals, preferredSubjects } = req.body;

    // Update base user info
    await conn.execute(
      'UPDATE `User` SET name = ? WHERE id = ?',
      [name, userId]
    );

    // Get user role
    const [users] = await conn.execute(
      'SELECT role FROM `User` WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { role } = users[0];

    if (role === 'TUTOR') {
      // Update tutor info
      await conn.execute(
        'UPDATE `Tutor` SET location = ?, availability = ? WHERE userId = ?',
        [location, JSON.stringify(availability), userId]
      );

      // Update subjects
      if (subjects) {
        // Get tutor ID
        const [tutors] = await conn.execute(
          'SELECT id FROM `Tutor` WHERE userId = ?',
          [userId]
        );
        const tutorId = tutors[0].id;

        // Remove existing subjects
        await conn.execute(
          'DELETE FROM `_TutorSubjects` WHERE A = ?',
          [tutorId]
        );

        // Add new subjects
        for (const subject of subjects) {
          let [subjectResult] = await conn.execute(
            'SELECT id FROM `Subject` WHERE name = ?',
            [subject]
          );

          let subjectId;
          if (subjectResult.length === 0) {
            const [newSubject] = await conn.execute(
              'INSERT INTO `Subject` (name) VALUES (?)',
              [subject]
            );
            subjectId = newSubject.insertId;
          } else {
            subjectId = subjectResult[0].id;
          }

          await conn.execute(
            'INSERT INTO `_TutorSubjects` (A, B) VALUES (?, ?)',
            [tutorId, subjectId]
          );
        }
      }
    } else if (role === 'STUDENT') {
      // Update student info
      await conn.execute(
        'UPDATE `Student` SET learningGoals = ? WHERE userId = ?',
        [learningGoals, userId]
      );

      // Update preferred subjects
      if (preferredSubjects) {
        // Get student ID
        const [students] = await conn.execute(
          'SELECT id FROM `Student` WHERE userId = ?',
          [userId]
        );
        const studentId = students[0].id;

        // Remove existing preferred subjects
        await conn.execute(
          'DELETE FROM `_StudentPreferredSubjects` WHERE A = ?',
          [studentId]
        );

        // Add new preferred subjects
        for (const subject of preferredSubjects) {
          let [subjectResult] = await conn.execute(
            'SELECT id FROM `Subject` WHERE name = ?',
            [subject]
          );

          let subjectId;
          if (subjectResult.length === 0) {
            const [newSubject] = await conn.execute(
              'INSERT INTO `Subject` (name) VALUES (?)',
              [subject]
            );
            subjectId = newSubject.insertId;
          } else {
            subjectId = subjectResult[0].id;
          }

          await conn.execute(
            'INSERT INTO `_StudentPreferredSubjects` (A, B) VALUES (?, ?)',
            [studentId, subjectId]
          );
        }
      }
    }

    await conn.commit();

    // Fetch updated profile
    const [updatedUser] = await conn.execute(
      `SELECT 
        u.*,
        s.id as studentId, s.learningGoals,
        t.id as tutorId, t.location, t.availability, t.isVerified,
        GROUP_CONCAT(DISTINCT sub.name) as subjects
      FROM User u
      LEFT JOIN Student s ON u.id = s.userId
      LEFT JOIN Tutor t ON u.id = t.userId
      LEFT JOIN _TutorSubjects ts ON t.id = ts.A
      LEFT JOIN Subject sub ON ts.B = sub.id
      WHERE u.id = ?
      GROUP BY u.id`,
      [userId]
    );

    res.status(200).json({ 
      message: 'Profile updated successfully', 
      user: updatedUser[0] 
    });
  } catch (error) {
    await conn.rollback();
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  } finally {
    conn.release();
  }
});

// =============== SESSION MANAGEMENT ===============

// Create Session Request
router.post('/session/request', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { studentId, tutorId, subject, content, requestedTime } = req.body;

    // Verify student exists
    const [student] = await conn.execute(
      'SELECT id FROM `Student` WHERE userId = ?',
      [studentId]
    );

    if (student.length === 0) {
      return res.status(400).json({ message: 'Invalid student ID' });
    }

    // Verify tutor exists
    const [tutor] = await conn.execute(
      'SELECT id FROM `Tutor` WHERE userId = ?',
      [tutorId]
    );

    if (tutor.length === 0) {
      return res.status(400).json({ message: 'Invalid tutor ID' });
    }

    // Get or create subject
    let [subjectResult] = await conn.execute(
      'SELECT id FROM `Subject` WHERE name = ?',
      [subject]
    );

    let subjectId;
    if (subjectResult.length === 0) {
      const [newSubject] = await conn.execute(
        'INSERT INTO `Subject` (name) VALUES (?)',
        [subject]
      );
      subjectId = newSubject.insertId;
    } else {
      subjectId = subjectResult[0].id;
    }

    // Create session request
    const [sessionRequest] = await conn.execute(
      `INSERT INTO SessionRequest 
       (studentId, tutorId, subjectId, content, requestedTime, status) 
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [student[0].id, tutor[0].id, subjectId, content, new Date(requestedTime)]
    );

    await conn.commit();
    res.status(201).json({
      message: 'Session request sent successfully',
      sessionRequestId: sessionRequest.insertId
    });
  } catch (error) {
    await conn.rollback();
    console.error('Error creating session request:', error);
    res.status(500).json({ message: 'Error creating session request', error: error.message });
  } finally {
    conn.release();
  }
});

// Get Session Requests
router.get('/session-requests', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { role, userId } = req.query;
    
    let sql, params;

    if (role === 'ADMIN') {
      sql = `
        SELECT 
          sr.*,
          s.userId as studentUserId, su.name as studentName,
          t.userId as tutorUserId, tu.name as tutorName,
          sub.name as subjectName
        FROM SessionRequest sr
        JOIN Student s ON sr.studentId = s.id
        JOIN User su ON s.userId = su.id
        JOIN Tutor t ON sr.tutorId = t.id
        JOIN User tu ON t.userId = tu.id
        JOIN Subject sub ON sr.subjectId = sub.id`;
      params = [];
    } else if (role === 'STUDENT') {
      sql = `
        SELECT 
          sr.*,
          t.userId as tutorUserId, u.name as tutorName,
          sub.name as subjectName
        FROM SessionRequest sr
        JOIN Student s ON sr.studentId = s.id
        JOIN Tutor t ON sr.tutorId = t.id
        JOIN User u ON t.userId = u.id
        JOIN Subject sub ON sr.subjectId = sub.id
        WHERE s.userId = ?`;
      params = [userId];
    } else if (role === 'TUTOR') {
      sql = `
        SELECT 
          sr.*,
          s.userId as studentUserId, u.name as studentName,
          sub.name as subjectName
        FROM SessionRequest sr
        JOIN Student s ON sr.studentId = s.id
        JOIN User u ON s.userId = u.id
        JOIN Tutor t ON sr.tutorId = t.id
        JOIN Subject sub ON sr.subjectId = sub.id
        WHERE t.userId = ?`;
      params = [userId];
    } else {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    const [requests] = await conn.execute(sql, params);

    // Format the requests
    const formattedRequests = requests.map(request => ({
      id: request.id,
      student: {
        id: request.studentUserId,
        name: request.studentName
      },
      tutor: {
        id: request.tutorUserId,
        name: request.tutorName
      },
      subject: request.subjectName,
      requestedTime: request.requestedTime,
      status: request.status
    }));

    res.status(200).json({ requests: formattedRequests });
  } catch (error) {
    console.error('Error fetching session requests:', error);
    res.status(500).json({ message: 'Error fetching session requests', error: error.message });
  } finally {
    conn.release();
  }
});

// Respond to Session Request
router.put('/session/:id/respond', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { status } = req.body;
    const sessionRequestId = parseInt(req.params.id);

    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    // Get session request details
    const [sessionRequests] = await conn.execute(
      `SELECT sr.*, 
              s.userId as studentUserId, su.name as studentName,
              t.userId as tutorUserId, tu.name as tutorName,
              sub.name as subjectName
       FROM SessionRequest sr
       JOIN Student s ON sr.studentId = s.id
       JOIN User su ON s.userId = su.id
       JOIN Tutor t ON sr.tutorId = t.id
       JOIN User tu ON t.userId = tu.id
       JOIN Subject sub ON sr.subjectId = sub.id
       WHERE sr.id = ?`,
      [sessionRequestId]
    );

    if (sessionRequests.length === 0) {
      return res.status(404).json({ message: 'Session request not found' });
    }

    const sessionRequest = sessionRequests[0];

    // Update session request status
    await conn.execute(
      'UPDATE SessionRequest SET status = ? WHERE id = ?',
      [status, sessionRequestId]
    );

    let newSession = null;
    if (status === 'accepted') {
      // Create new session
      const [sessionResult] = await conn.execute(
        'INSERT INTO Session (tutorId, sessionRequestId) VALUES (?, ?)',
        [sessionRequest.tutorId, sessionRequestId]
      );
      
      const sessionId = sessionResult.insertId;
      
      // Add student to session
      await conn.execute(
        'INSERT INTO _SessionStudents (A, B) VALUES (?, ?)',
        [sessionId, sessionRequest.studentId]
      );

      newSession = {
        id: sessionId,
        tutor: {
          id: sessionRequest.tutorUserId,
          name: sessionRequest.tutorName
        },
        students: [{
          id: sessionRequest.studentUserId,
          name: sessionRequest.studentName
        }],
        messages: [],
        status: 'active'
      };
    }

    await conn.commit();
    res.status(200).json({
      message: status === 'accepted' ? 
        'Session request accepted and session created' : 
        'Session request declined',
      sessionRequest: {
        id: sessionRequest.id,
        status: status
      },
      session: newSession
    });
  } catch (error) {
    await conn.rollback();
    console.error('Error responding to session request:', error);
    res.status(500).json({ message: 'Error responding to session request', error: error.message });
  } finally {
    conn.release();
  }
});

// Get User Sessions
router.get('/sessions/:userId', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const userId = parseInt(req.params.userId);

    // First get user role
    const [users] = await conn.execute(
      'SELECT role FROM User WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { role } = users[0];

    let sql;
    if (role === 'TUTOR') {
      sql = `
        SELECT 
          s.*,
          t.userId as tutorUserId,
          tu.name as tutorName,
          GROUP_CONCAT(DISTINCT st.userId) as studentIds,
          GROUP_CONCAT(DISTINCT su.name) as studentNames,
          sr.id as sessionRequestId,
          sr.status as requestStatus,
          sj.name as subject
        FROM Session s
        JOIN Tutor t ON s.tutorId = t.id
        JOIN User tu ON t.userId = tu.id
        JOIN _SessionStudents ss ON s.id = ss.A
        JOIN Student st ON ss.B = st.id
        JOIN User su ON st.userId = su.id
        LEFT JOIN SessionRequest sr ON s.sessionRequestId = sr.id
        LEFT JOIN Subject sj ON sr.subjectId = sj.id
        WHERE t.userId = ?
        GROUP BY s.id`;
    } else {
      sql = `
        SELECT 
          s.*,
          t.userId as tutorUserId,
          tu.name as tutorName,
          GROUP_CONCAT(DISTINCT st.userId) as studentIds,
          GROUP_CONCAT(DISTINCT su.name) as studentNames,
          sr.id as sessionRequestId,
          sr.status as requestStatus,
          sj.name as subject
        FROM Session s
        JOIN Tutor t ON s.tutorId = t.id
        JOIN User tu ON t.userId = tu.id
        JOIN _SessionStudents ss ON s.id = ss.A
        JOIN Student st ON ss.B = st.id
        JOIN User su ON st.userId = su.id
        LEFT JOIN SessionRequest sr ON s.sessionRequestId = sr.id
        LEFT JOIN Subject sj ON sr.subjectId = sj.id
        WHERE st.userId = ?
        GROUP BY s.id`;
    }

    const [sessions] = await conn.execute(sql, [userId]);

    // Format each session
    const formattedSessions = sessions.map(session => {
      const studentIds = session.studentIds.split(',');
      const studentNames = session.studentNames.split(',');
      
      return {
        id: session.id,
        tutor: {
          id: session.tutorUserId,
          name: session.tutorName
        },
        students: studentIds.map((id, index) => ({
          id: parseInt(id),
          name: studentNames[index]
        })),
        subject: session.subject,
        status: session.requestStatus || 'active',
        sessionRequestId: session.sessionRequestId,
        createdAt: session.createdAt
      };
    });

    res.status(200).json(formattedSessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ message: 'Error fetching sessions', error: error.message });
  } finally {
    conn.release();
  }
});

// Helper route to get session details
router.get('/sessions/:sessionId/details', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const sessionId = parseInt(req.params.sessionId);

    const [sessions] = await conn.execute(`
      SELECT 
        s.*,
        t.userId as tutorUserId,
        tu.name as tutorName,
        GROUP_CONCAT(DISTINCT st.userId) as studentIds,
        GROUP_CONCAT(DISTINCT su.name) as studentNames,
        sr.status as requestStatus,
        sj.name as subject
      FROM Session s
      JOIN Tutor t ON s.tutorId = t.id
      JOIN User tu ON t.userId = tu.id
      JOIN _SessionStudents ss ON s.id = ss.A
      JOIN Student st ON ss.B = st.id
      JOIN User su ON st.userId = su.id
      LEFT JOIN SessionRequest sr ON s.sessionRequestId = sr.id
      LEFT JOIN Subject sj ON sr.subjectId = sj.id
      WHERE s.id = ?
      GROUP BY s.id
    `, [sessionId]);

    if (sessions.length === 0) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const session = sessions[0];
    const formattedSession = {
      id: session.id,
      tutor: {
        id: session.tutorUserId,
        name: session.tutorName
      },
      students: session.studentIds.split(',').map((id, index) => ({
        id: parseInt(id),
        name: session.studentNames.split(',')[index]
      })),
      subject: session.subject,
      status: session.requestStatus || 'active',
      createdAt: session.createdAt
    };

    res.status(200).json(formattedSession);
  } catch (error) {
    console.error('Error fetching session details:', error);
    res.status(500).json({ message: 'Error fetching session details', error: error.message });
  } finally {
    conn.release();
  }
});

// Create Session
router.post('/sessions', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { tutorId, studentIds } = req.body;

    // Check if tutor exists
    const [tutor] = await conn.execute(
      'SELECT id FROM Tutor WHERE userId = ?',
      [tutorId]
    );

    if (tutor.length === 0) {
      return res.status(404).json({ message: 'Tutor not found' });
    }

    // Create session
    const [sessionResult] = await conn.execute(
      'INSERT INTO Session (tutorId) VALUES (?)',
      [tutor[0].id]
    );

    const sessionId = sessionResult.insertId;

    // Add students to session
    for (const studentId of studentIds) {
      const [student] = await conn.execute(
        'SELECT id FROM Student WHERE userId = ?',
        [studentId]
      );

      if (student.length === 0) {
        await conn.rollback();
        return res.status(404).json({ message: `Student with ID ${studentId} not found` });
      }

      await conn.execute(
        'INSERT INTO _SessionStudents (A, B) VALUES (?, ?)',
        [sessionId, student[0].id]
      );
    }

    // Get session details
    const [sessions] = await conn.execute(
      `SELECT 
        s.*,
        t.userId as tutorUserId, tu.name as tutorName,
        GROUP_CONCAT(DISTINCT st.userId) as studentIds,
        GROUP_CONCAT(DISTINCT su.name) as studentNames
      FROM Session s
      JOIN Tutor t ON s.tutorId = t.id
      JOIN User tu ON t.userId = tu.id
      JOIN _SessionStudents ss ON s.id = ss.A
      JOIN Student st ON ss.B = st.id
      JOIN User su ON st.userId = su.id
      WHERE s.id = ?
      GROUP BY s.id`,
      [sessionId]
    );

    await conn.commit();

    const session = sessions[0];
    const formattedSession = {
      id: session.id,
      tutor: {
        id: session.tutorUserId,
        name: session.tutorName
      },
      students: session.studentIds.split(',').map((id, index) => ({
        id: parseInt(id),
        name: session.studentNames.split(',')[index]
      })),
      createdAt: session.createdAt
    };

    res.status(201).json(formattedSession);
  } catch (error) {
    await conn.rollback();
    console.error('Error creating session:', error);
    res.status(500).json({ message: 'Error creating session', error: error.message });
  } finally {
    conn.release();
  }
});

// Delete Session
router.delete('/sessions/:id', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const sessionId = parseInt(req.params.id);

    // Check if session exists
    const [session] = await conn.execute(
      'SELECT id FROM Session WHERE id = ?',
      [sessionId]
    );

    if (session.length === 0) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Delete messages first
    await conn.execute(
      'DELETE FROM Message WHERE sessionId = ?',
      [sessionId]
    );

    // Delete student associations
    await conn.execute(
      'DELETE FROM _SessionStudents WHERE A = ?',
      [sessionId]
    );

    // Update session requests to nullify the sessionId
    await conn.execute(
      'UPDATE SessionRequest SET sessionId = NULL WHERE sessionId = ?',
      [sessionId]
    );

    // Finally delete the session
    await conn.execute(
      'DELETE FROM Session WHERE id = ?',
      [sessionId]
    );

    await conn.commit();
    res.status(200).json({ message: 'Session deleted successfully' });
  } catch (error) {
    await conn.rollback();
    console.error('Error deleting session:', error);
    res.status(500).json({ message: 'Error deleting session', error: error.message });
  } finally {
    conn.release();
  }
});

// =============== MESSAGES ===============

// Get Session Messages
router.get('/sessions/:sessionId/messages', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { sessionId } = req.params;

    const [messages] = await conn.execute(
      `SELECT m.*, u.name as senderName
       FROM Message m
       JOIN User u ON m.senderId = u.id
       WHERE m.sessionId = ?
       ORDER BY m.createdAt ASC`,
      [sessionId]
    );

    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      senderId: msg.senderId,
      senderName: msg.senderName,
      createdAt: msg.createdAt
    }));

    res.status(200).json(formattedMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  } finally {
    conn.release();
  }
});

// Get Current User
router.get('/current', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const userId = req.headers['user-id'];
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Get user with role-specific data
    const [users] = await conn.execute(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        t.id as tutorId,
        t.location,
        t.availability,
        t.isVerified,
        t.careerStatus,
        s.id as studentId,
        s.learningGoals
      FROM User u
      LEFT JOIN Tutor t ON u.id = t.userId
      LEFT JOIN Student s ON u.id = s.userId
      WHERE u.id = ?
    `, [userId]);

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];

    let formattedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    if (user.role === 'TUTOR') {
      // Get tutor's subjects
      const [subjects] = await conn.execute(`
        SELECT DISTINCT s.name
        FROM Subject s
        JOIN _TutorSubjects ts ON s.id = ts.B
        JOIN Tutor t ON ts.A = t.id
        WHERE t.id = ?
      `, [user.tutorId]);

      // Handle availability data
      let availability = user.availability;
      if (typeof availability === 'string') {
        try {
          availability = JSON.parse(availability);
        } catch (error) {
          console.error('Error parsing availability:', error);
          availability = [];
        }
      }

      // Add tutor-specific data
      formattedUser = {
        ...formattedUser,
        location: user.location || null,
        availability: availability,
        isVerified: Boolean(user.isVerified),
        careerStatus: user.careerStatus || null,
        subjects: subjects.map(s => ({ name: s.name }))
      };
    } else if (user.role === 'STUDENT') {
      // Get student's preferred subjects
      const [preferredSubjects] = await conn.execute(`
        SELECT DISTINCT s.name
        FROM Subject s
        JOIN _StudentPreferredSubjects sps ON s.id = sps.B
        JOIN Student st ON sps.A = st.id
        WHERE st.id = ?
      `, [user.studentId]);

      // Add student-specific data
      formattedUser = {
        ...formattedUser,
        learningGoals: user.learningGoals || null,
        preferredSubjects: preferredSubjects.map(s => ({ name: s.name }))
      };
    }

    // Log the formatted data for debugging
    console.log('Formatted user data:', JSON.stringify(formattedUser, null, 2));

    res.status(200).json({ user: formattedUser });
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ message: 'Error fetching current user', error: error.message });
  } finally {
    conn.release();
  }
});

// =============== FEEDBACK SYSTEM ===============

// Submit Feedback
router.post('/session/:id/feedback', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { rating, comments, fromId } = req.body;
    const sessionId = parseInt(req.params.id);

    // Get session and related data
    const [sessions] = await conn.execute(
      `SELECT s.*, sr.id as sessionRequestId, t.userId as tutorUserId
       FROM Session s
       JOIN SessionRequest sr ON s.sessionRequestId = sr.id
       JOIN Tutor t ON s.tutorId = t.id
       WHERE s.id = ?`,
      [sessionId]
    );

    if (sessions.length === 0) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const session = sessions[0];

    // Check if feedback already exists
    const [existingFeedback] = await conn.execute(
      'SELECT id FROM Feedback WHERE sessionRequestId = ?',
      [session.sessionRequestId]
    );

    if (existingFeedback.length > 0) {
      return res.status(400).json({ message: 'Feedback already exists for this session' });
    }

    // Create feedback
    const [feedbackResult] = await conn.execute(
      `INSERT INTO Feedback 
       (sessionRequestId, fromId, toId, rating, comments)
       VALUES (?, ?, ?, ?, ?)`,
      [session.sessionRequestId, fromId, session.tutorUserId, rating, comments || '']
    );

    await conn.commit();
    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedbackId: feedbackResult.insertId
    });
  } catch (error) {
    await conn.rollback();
    console.error('Error submitting feedback:', error);
    res.status(500).json({ message: 'Error submitting feedback', error: error.message });
  } finally {
    conn.release();
  }
});

// Get All Feedbacks (Admin only)
router.get('/feedbacks', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [feedbacks] = await conn.execute(
      `SELECT f.*,
              fu.name as fromName, fu.role as fromRole,
              tu.name as toName, tu.role as toRole
       FROM Feedback f
       JOIN User fu ON f.fromId = fu.id
       JOIN User tu ON f.toId = tu.id`
    );

    const formattedFeedbacks = feedbacks.map(feedback => ({
      id: feedback.id,
      from: { 
        name: feedback.fromName, 
        role: feedback.fromRole 
      },
      to: { 
        name: feedback.toName, 
        role: feedback.toRole 
      },
      rating: feedback.rating,
      comments: feedback.comments
    }));

    res.status(200).json({ feedbacks: formattedFeedbacks });
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    res.status(500).json({ message: 'Error fetching feedbacks', error: error.message });
  } finally {
    conn.release();
  }
});

// =============== SUBJECT MANAGEMENT ===============

// Get All Subjects
router.get('/subjects', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [subjects] = await conn.execute(
      'SELECT id, name FROM Subject ORDER BY name'
    );
    res.status(200).json({ subjects });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ message: 'Error fetching subjects', error: error.message });
  } finally {
    conn.release();
  }
});

// Add Subject (Admin only)
router.post('/subjects', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { name } = req.body;

    // Check if subject already exists
    const [existingSubject] = await conn.execute(
      'SELECT id FROM Subject WHERE name = ?',
      [name]
    );

    if (existingSubject.length > 0) {
      return res.status(400).json({ message: 'Subject already exists' });
    }

    const [result] = await conn.execute(
      'INSERT INTO Subject (name) VALUES (?)',
      [name]
    );

    res.status(201).json({
      message: 'Subject added successfully',
      subject: {
        id: result.insertId,
        name
      }
    });
  } catch (error) {
    console.error('Error adding subject:', error);
    res.status(500).json({ message: 'Error adding subject', error: error.message });
  } finally {
    conn.release();
  }
});

// Delete Subject (Admin only)
router.delete('/subjects/:id', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { id } = req.params;

    // Remove subject associations first
    await conn.execute(
      'DELETE FROM _TutorSubjects WHERE B = ?',
      [id]
    );

    await conn.execute(
      'DELETE FROM _StudentPreferredSubjects WHERE B = ?',
      [id]
    );

    // Delete the subject
    await conn.execute(
      'DELETE FROM Subject WHERE id = ?',
      [id]
    );

    await conn.commit();
    res.status(200).json({ message: 'Subject deleted successfully' });
  } catch (error) {
    await conn.rollback();
    console.error('Error deleting subject:', error);
    res.status(500).json({ message: 'Error deleting subject', error: error.message });
  } finally {
    conn.release();
  }
});

router.get('/search', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { query, role } = req.query;

    if (!query || !role) {
      return res.status(400).json({ message: 'Query and role are required' });
    }

    const searchTerm = `%${query.toLowerCase()}%`;
    let sql, params;

    if (role.toLowerCase() === 'student') {
      // Students searching for tutors
      sql = `
        SELECT 
          u.id, 
          u.name, 
          u.email, 
          u.role,
          t.location,
          t.availability,
          t.isVerified,
          GROUP_CONCAT(DISTINCT s.name) as subjects,
          COUNT(DISTINCT sr.id) as totalSessions
        FROM User u
        JOIN Tutor t ON u.id = t.userId
        LEFT JOIN _TutorSubjects ts ON t.id = ts.A
        LEFT JOIN Subject s ON ts.B = s.id
        LEFT JOIN Session sr ON t.id = sr.tutorId
        WHERE u.role = 'TUTOR'
          AND (LOWER(u.name) LIKE ? OR EXISTS (
            SELECT 1 FROM _TutorSubjects ts2 
            JOIN Subject s2 ON ts2.B = s2.id 
            WHERE ts2.A = t.id AND LOWER(s2.name) LIKE ?
          ))
        GROUP BY u.id, t.id, t.location, t.availability, t.isVerified
      `;
      params = [searchTerm, searchTerm];
    } else if (role.toLowerCase() === 'tutor') {
      // Tutors searching for students
      sql = `
        SELECT DISTINCT
          u.id, 
          u.name, 
          u.email, 
          u.role,
          s.learningGoals,
          GROUP_CONCAT(DISTINCT sub.name) as preferredSubjects
        FROM User u
        JOIN Student s ON u.id = s.userId
        LEFT JOIN _StudentPreferredSubjects sps ON s.id = sps.A
        LEFT JOIN Subject sub ON sps.B = sub.id
        WHERE u.role = 'STUDENT'
          AND (LOWER(u.name) LIKE ? OR EXISTS (
            SELECT 1 FROM _StudentPreferredSubjects sps2 
            JOIN Subject s2 ON sps2.B = s2.id 
            WHERE sps2.A = s.id AND LOWER(s2.name) LIKE ?
          ))
        GROUP BY u.id, s.id, s.learningGoals
      `;
      params = [searchTerm, searchTerm];
    } else {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    const [results] = await conn.execute(sql, params);
    
    // Format results
    const formattedResults = await Promise.all(results.map(async (user) => {
      let formattedUser = {
        ...user,
        subjects: [],
        preferredSubjects: []
      };

      if (user.role === 'TUTOR') {
        // Get tutor's subjects
        const [subjects] = await conn.execute(`
          SELECT s.name
          FROM Subject s
          JOIN _TutorSubjects ts ON s.id = ts.B
          JOIN Tutor t ON ts.A = t.id
          WHERE t.userId = ?
        `, [user.id]);
        
        formattedUser.subjects = subjects.map(s => ({ name: s.name }));
        
        // Parse availability if it exists
        try {
          formattedUser.availability = user.availability ? JSON.parse(user.availability) : null;
        } catch (e) {
          formattedUser.availability = null;
          console.error('Error parsing availability:', e);
        }
      } else {
        // Get student's preferred subjects
        const [preferredSubjects] = await conn.execute(`
          SELECT s.name
          FROM Subject s
          JOIN _StudentPreferredSubjects sps ON s.id = sps.B
          JOIN Student st ON sps.A = st.id
          WHERE st.userId = ?
        `, [user.id]);
        
        formattedUser.preferredSubjects = preferredSubjects.map(s => ({ name: s.name }));
      }

      return formattedUser;
    }));

    res.status(200).json({ results: formattedResults });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Error searching users', error: error.message });
  } finally {
    conn.release();
  }
});

module.exports = router;