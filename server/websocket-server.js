const WebSocket = require('ws');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const wss = new WebSocket.Server({ port: 5001 });

const clients = new Map();

wss.on('connection', async (ws) => {
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
            console.error('No active session');
            return;
          }

          // First verify the session exists
          const session = await prisma.session.findUnique({
            where: { id: parseInt(sessionId) }
          });

          if (!session) {
            console.error('Session not found');
            return;
          }

          // Save the message to the database
          const savedMessage = await prisma.message.create({
            data: {
              content: data.content,
              sender: {
                connect: { id: data.senderId }
              },
              session: {
                connect: { id: parseInt(sessionId) }
              }
            },
            include: {
              sender: true
            }
          });

          // Broadcast the message to all clients in the same session
          const broadcastMessage = {
            type: 'chat',
            id: savedMessage.id,
            content: savedMessage.content,
            senderId: savedMessage.sender.id,
            senderName: data.senderName,
            createdAt: savedMessage.createdAt
          };

          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN && clients.get(client) === sessionId) {
              client.send(JSON.stringify(broadcastMessage));
            }
          });
          break;
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log('WebSocket connection closed');
  });
});

module.exports = wss;