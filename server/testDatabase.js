// server/testDatabase.js
const { pool, executeQuery } = require('./dbUtils');

async function testConnection() {
  try {
    // Test basic connection
    const [rows] = await pool.execute('SELECT 1');
    console.log('Database connection successful!');

    // Test User table
    const users = await executeQuery('SELECT * FROM `User` LIMIT 1');
    console.log('\nTest User query:');
    console.log(users);

    // Test a join query
    const testJoin = await executeQuery(
      "SELECT u.*, s.learningGoals FROM `User` u LEFT JOIN `Student` s ON u.id = s.userId WHERE u.role = 'STUDENT' LIMIT 1"
    );
    console.log('\nTest join query:');
    console.log(testJoin);

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await pool.end();
  }
}

testConnection();