// server/dbUtils.js
const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'edu_connect_user',
  password: process.env.DB_PASSWORD || 'your_password',
  database: 'edu_connect_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true
});

// Generic query executor
async function executeQuery(sql, params = []) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}

// Transaction wrapper
async function withTransaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Common database operations
const dbOperations = {
  // User operations
  async findUserById(userId) {
    const sql = "SELECT u.*, s.id as studentId, s.learningGoals, t.id as tutorId, t.location, t.availability, t.isVerified, GROUP_CONCAT(DISTINCT sub.name) as subjects FROM `User` u LEFT JOIN `Student` s ON u.id = s.userId LEFT JOIN `Tutor` t ON u.id = t.userId LEFT JOIN `_TutorSubjects` ts ON t.id = ts.A LEFT JOIN `Subject` sub ON ts.B = sub.id WHERE u.id = ? GROUP BY u.id";
    const results = await executeQuery(sql, [userId]);
    return results[0];
  },

  async findUserByEmail(email) {
    const sql = "SELECT * FROM `User` WHERE email = ?";
    const results = await executeQuery(sql, [email]);
    return results[0];
  },

  async createUser(userData) {
    return await withTransaction(async (connection) => {
      const [userResult] = await connection.execute(
        "INSERT INTO `User` (name, email, password, role) VALUES (?, ?, ?, ?)",
        [userData.name, userData.email, userData.password, userData.role]
      );
      return userResult.insertId;
    });
  }
};

module.exports = {
  pool,
  executeQuery,
  withTransaction,
  dbOperations
};