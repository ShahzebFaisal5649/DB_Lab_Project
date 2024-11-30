// server.js
const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
require('dotenv').config();
const { pool } = require('./dbUtils');

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket server
const wss = new WebSocket.Server({ server });

// WebSocket connection handling
wss.on('connection', async (ws) => {
  console.log('New WebSocket connection established');
  
  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', async (message) => {
    const conn = await pool.getConnection();
    try {
      const data = JSON.parse(message.toString());
      console.log('Received message:', data);

      switch (data.type) {
        case 'join':
          // Handle join
          const sessionId = parseInt(data.sessionId);
          const [sessions] = await conn.execute(
            'SELECT id FROM Session WHERE id = ?',
            [sessionId]
          );

          if (sessions.length > 0) {
            ws.sessionId = sessionId;
            ws.send(JSON.stringify({ 
              type: 'joined', 
              sessionId,
              timestamp: new Date().toISOString()
            }));
          }
          break;

        case 'chat':
          // Handle chat message
          if (!ws.sessionId) {
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Not joined to a session' 
            }));
            return;
          }

          const [result] = await conn.execute(
            'INSERT INTO Message (content, senderId, sessionId, createdAt) VALUES (?, ?, ?, NOW())',
            [data.content, data.senderId, ws.sessionId]
          );

          const [users] = await conn.execute(
            'SELECT name FROM User WHERE id = ?',
            [data.senderId]
          );

          const messageToSend = {
            type: 'chat',
            id: result.insertId,
            content: data.content,
            senderId: data.senderId,
            senderName: users[0].name,
            createdAt: new Date().toISOString()
          };

          // Broadcast to all clients in the same session
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN && client.sessionId === ws.sessionId) {
              client.send(JSON.stringify(messageToSend));
            }
          });
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Server error processing message' 
      }));
    } finally {
      conn.release();
    }
  });

  // Handle connection close
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Heartbeat interval
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(interval);
});

// Routes
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something broke!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server is ready`);
});