import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { ScrollArea } from "./ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Send } from "lucide-react"
import { toast } from 'react-hot-toast';

interface Message {
  id: number;
  content: string;
  senderId: number;
  senderName: string;
  createdAt: string;
}

const SessionRequests: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const ws = useRef<WebSocket | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // In SessionRequests.tsx, update the useEffect:

useEffect(() => {
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const userIdFromStorage = localStorage.getItem('userId');
      if (!userIdFromStorage) {
        console.error('User ID not found in localStorage');
        return;
      }

      const userResponse = await fetch('http://localhost:5000/api/users/current', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'user-id': userIdFromStorage,
        },
      });

      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        console.error('Failed to fetch current user:', errorData.message);
        return;
      }

      const userData = await userResponse.json();
      setUserId(userData.user.id);
      setUserName(userData.user.name);

      const messagesResponse = await fetch(`http://localhost:5000/api/users/sessions/${sessionId}/messages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'user-id': userIdFromStorage,
        },
      });

      if (!messagesResponse.ok) {
        const errorData = await messagesResponse.json();
        console.error('Failed to fetch messages:', errorData.message);
        return;
      }

      const messagesData = await messagesResponse.json();
      setMessages(messagesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupWebSocket = () => {
    // Close existing connection if any
    if (ws.current) {
      ws.current.close();
    }

    // Create new WebSocket connection
    try {
      ws.current = new WebSocket('ws://localhost:5000');
      
      ws.current.onopen = () => {
        console.log('WebSocket Connected');
        if (sessionId) {
          ws.current?.send(JSON.stringify({ 
            type: 'join', 
            sessionId: parseInt(sessionId)
          }));
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('Received message:', message);
          
          if (message.type === 'chat') {
            setMessages(prevMessages => [...prevMessages, message]);
          } else if (message.type === 'error') {
            console.error('Server error:', message.message);
            toast.error(message.message);
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.current.onclose = () => {
        console.log('WebSocket connection closed');
      };
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
    }
  };

  // Initial data fetch
  fetchData();
  
  // Setup WebSocket connection
  setupWebSocket();

  // Cleanup function
  return () => {
    if (ws.current) {
      ws.current.close();
    }
  };
}, [sessionId]);

useEffect(() => {
  if (scrollAreaRef.current) {
    scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
  }
}, [messages]);

// Update sendMessage function
const sendMessage = () => {
  if (!newMessage.trim()) return;

  if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
    toast.error('Connection lost. Please try again.');
    return;
  }

  try {
    const message = {
      type: 'chat',
      sessionId: parseInt(sessionId as string),
      content: newMessage,
      senderId: userId,
      senderName: userName,
    };

    ws.current.send(JSON.stringify(message));
    setNewMessage('');
  } catch (error) {
    console.error('Error sending message:', error);
    toast.error('Failed to send message');
  }
};

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-background">
      <header className="p-4 border-b">
        <h1 className="text-2xl font-bold">Chat Session</h1>
      </header>
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages && messages.map((message) => (
            <div key={message.id} className={`flex ${message.senderId === userId ? 'justify-end' : 'justify-start'}`}>
              <Card className={`max-w-[70%] ${message.senderId === userId ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <CardContent className="p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${message.senderName}`} />
                      <AvatarFallback>{message.senderName[0]}</AvatarFallback>
                    </Avatar>
                    <p className="text-sm font-medium">{message.senderName}</p>
                  </div>
                  <p className="text-sm">{message.content}</p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </ScrollArea>
      <footer className="p-4 border-t">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex space-x-2">
          <Input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </footer>
    </div>
  );
};

export default SessionRequests;