const WebSocket = require('ws');
const { pool } = require('./dbUtils');

class WebSocketServer {
  constructor(server, port) {
    // Initialize WebSocket server with either an HTTP server or a specific port
    this.wss = server ? new WebSocket.Server({ server }) : new WebSocket.Server({ port });

    // Store client sessions
    this.clients = new Map();

    // Set up server event handlers
    this.setupServerHandlers();

    console.log(`WebSocket server ${server ? 'attached to HTTP server' : 'listening on port ' + port}`);
  }

  setupServerHandlers() {
    this.wss.on('connection', (ws) => {
      console.log('New WebSocket connection established');
      
      // Setup connection state
      ws.isAlive = true;
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      // Handle incoming messages
      ws.on('message', async (message) => {
        const conn = await pool.getConnection();
        try {
          let data = this.parseMessage(message);
          if (!data) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Invalid message format'
            }));
            return;
          }

          await this.handleMessage(ws, data, conn);
        } catch (error) {
          console.error('Error handling message:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Server error',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
          }));
        } finally {
          conn.release();
        }
      });

      // Handle connection close
      ws.on('close', () => {
        this.handleClose(ws);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });

    // Set up heartbeat interval
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          return ws.terminate();
        }
        
        ws.isAlive = false;
        ws.ping(() => {});
      });
    }, 30000);
  }

  parseMessage(message) {
    try {
      return JSON.parse(message.toString());
    } catch (error) {
      console.error('Error parsing message:', error);
      return null;
    }
  }

  async handleMessage(ws, data, conn) {
    console.log('Received message:', data);
    
    switch (data.type) {
      case 'join':
        await this.handleJoin(ws, data, conn);
        break;
      case 'chat':
        await this.handleChat(ws, data, conn);
        break;
      default:
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Unknown message type'
        }));
    }
  }

  async handleJoin(ws, data, conn) {
    const sessionId = parseInt(data.sessionId);
    if (isNaN(sessionId)) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid session ID'
      }));
      return;
    }

    try {
      // Verify session exists
      const [sessions] = await conn.execute(
        'SELECT id FROM Session WHERE id = ?',
        [sessionId]
      );

      if (sessions.length === 0) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Session not found'
        }));
        return;
      }

      // Store client session
      this.clients.set(ws, sessionId);
      console.log(`Client joined session: ${sessionId}`);

      ws.send(JSON.stringify({
        type: 'joined',
        sessionId,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error in handleJoin:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to join session'
      }));
    }
  }

  async handleChat(ws, data, conn) {
    const sessionId = this.clients.get(ws);
    if (!sessionId) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Not joined to a session'
      }));
      return;
    }

    try {
      // Verify user's permission
      const [sessionAccess] = await conn.execute(`
        SELECT s.id 
        FROM Session s
        LEFT JOIN _SessionStudents ss ON s.id = ss.A
        LEFT JOIN Student st ON ss.B = st.id
        LEFT JOIN Tutor t ON s.tutorId = t.id
        WHERE s.id = ? 
        AND (st.userId = ? OR t.userId = ?)
        LIMIT 1
      `, [sessionId, data.senderId, data.senderId]);

      if (sessionAccess.length === 0) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Not authorized to send messages in this session'
        }));
        return;
      }

      // Save message
      const [result] = await conn.execute(
        'INSERT INTO Message (content, senderId, sessionId, createdAt) VALUES (?, ?, ?, NOW())',
        [data.content, data.senderId, sessionId]
      );

      // Get sender's name
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

      // Broadcast to all clients in the session
      this.wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN && this.clients.get(client) === sessionId) {
          client.send(JSON.stringify(messageToSend));
        }
      });
    } catch (error) {
      console.error('Error in handleChat:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to send message'
      }));
    }
  }

  handleClose(ws) {
    this.clients.delete(ws);
    console.log('WebSocket connection closed');
  }

  shutdown() {
    clearInterval(this.heartbeatInterval);
    this.wss.close(() => {
      console.log('WebSocket server closed');
    });
  }
}

module.exports = WebSocketServer;