// server/server.js
const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Basic route for Express server
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Edu Connect API' });
});

// Routes
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

// Start Express server on port 5000
const EXPRESS_PORT = process.env.EXPRESS_PORT || 5000;
const expressServer = http.createServer(app);
expressServer.listen(EXPRESS_PORT, () => {
  console.log(`Express server is running on port ${EXPRESS_PORT}`);
});

// Create WebSocket server on port 5001
const WS_PORT = process.env.WS_PORT || 5001;
const wsServer = new WebSocket.Server({ port: WS_PORT });

const clients = new Map();

wsServer.on('connection', (ws) => {
  console.log('New WebSocket connection');
  let sessionId;

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received message:', data);

      switch (data.type) {
        case 'join':
          sessionId = data.sessionId;
          clients.set(ws, sessionId);
          console.log(`Client joined session: ${sessionId}`);
          break;

        case 'chat':
          if (!sessionId) {
            console.error('No active session for this client');
            ws.send(JSON.stringify({ type: 'error', message: 'No active session' }));
            return;
          }

          // Save the message to the database
          const savedMessage = await prisma.message.create({
            data: {
              content: data.content,
              senderId: data.senderId,
              sessionId: parseInt(sessionId),
            },
          });

          console.log(`Message saved: "${savedMessage.content}" by user ${savedMessage.senderId}`);

          // Broadcast the message to all clients in the same session
          wsServer.clients.forEach((client) => {
            if (
              client !== ws &&
              clients.get(client) === sessionId &&
              client.readyState === WebSocket.OPEN
            ) {
              client.send(
                JSON.stringify({
                  type: 'chat',
                  sessionId: data.sessionId,
                  content: data.content,
                  senderId: data.senderId,
                  senderName: data.senderName,
                  id: savedMessage.id,
                  createdAt: savedMessage.createdAt,
                })
              );
              console.log(`Message broadcasted to client in session ${sessionId}`);
            }
          });
          break;

        default:
          console.error('Unknown message type:', data.type);
          ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Server error' }));
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log('WebSocket connection closed');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});


console.log(`WebSocket server is running on port ${WS_PORT}`);