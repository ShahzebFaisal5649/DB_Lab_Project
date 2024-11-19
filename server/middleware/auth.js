// server/middleware/auth.js
const { PrismaClient } = require('@prisma/client');

// Initialize Prisma Client
const prisma = new PrismaClient();

const isAdmin = async (req, res, next) => {
  try {
    // Check for user ID from headers or request body
    const userId = req.headers['user-id'] || req.body.userId;

    if (!userId) {
      return res.status(403).json({ message: 'User ID not provided.' });
    }

    // Convert userId to an integer
    const userIdInt = parseInt(userId, 10);

    if (isNaN(userIdInt)) {
      return res.status(400).json({ message: 'Invalid user ID format.' });
    }

    // Find the user in the database using Prisma
    const user = await prisma.user.findUnique({
      where: { id: userIdInt },
    });

    // Check if the user is an admin
    if (user && user.role === 'ADMIN') {
      req.user = user; // Add user information to the request object
      next(); // Proceed if the user is an admin
    } else {
      return res.status(403).json({ message: 'Forbidden: You do not have the correct permissions.' });
    }
  } catch (error) {
    console.error('Error in isAdmin middleware:', error);
    return res.status(403).json({ message: 'Forbidden: Invalid authentication.' });
  }
};

module.exports = { isAdmin };