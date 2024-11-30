// server/middleware/auth.js
const { pool } = require('../dbUtils');

const isAdmin = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const userId = req.headers['user-id'] || req.body.userId;

    if (!userId) {
      return res.status(403).json({ message: 'User ID not provided.' });
    }

    const userIdInt = parseInt(userId, 10);
    if (isNaN(userIdInt)) {
      return res.status(400).json({ message: 'Invalid user ID format.' });
    }

    // Check if user exists and is an admin
    const [users] = await conn.execute(
      'SELECT id, role FROM `User` WHERE id = ?',
      [userIdInt]
    );

    if (users.length > 0 && users[0].role === 'ADMIN') {
      req.user = users[0];
      next();
    } else {
      return res.status(403).json({ message: 'Forbidden: You do not have the correct permissions.' });
    }
  } catch (error) {
    console.error('Error in isAdmin middleware:', error);
    return res.status(403).json({ message: 'Forbidden: Invalid authentication.' });
  } finally {
    conn.release();
  }
};

module.exports = { isAdmin };