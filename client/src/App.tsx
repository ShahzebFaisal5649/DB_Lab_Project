import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import Home from './components/Home';
import Dashboard from './components/Dashboard';
import SessionRequests from './components/SessionRequests';
import AdminRegister from './components/AdminRegister';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import Navbar from './components/Navbar';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(
    localStorage.getItem('isLoggedIn') === 'true'
  );
  const [userRole, setUserRole] = useState<string | null>(
    localStorage.getItem('userRole')
  );
  const [userId, setUserId] = useState<string | null>(
    localStorage.getItem('userId')
  );
  const [userName, setUserName] = useState<string | null>(
    localStorage.getItem('userName')
  );

  useEffect(() => {
    localStorage.setItem('isLoggedIn', String(isLoggedIn));
    if (userRole) {
      localStorage.setItem('userRole', userRole);
    } else {
      localStorage.removeItem('userRole');
    }
    if (userId) {
      localStorage.setItem('userId', userId);
    } else {
      localStorage.removeItem('userId');
    }
  }, [isLoggedIn, userRole, userId]);

  // Keep userName in sync with localStorage
  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    if (storedName !== userName) setUserName(storedName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-background text-foreground flex flex-col">
          <Navbar
            isLoggedIn={isLoggedIn}
            userRole={userRole}
            userId={userId}
            setIsLoggedIn={setIsLoggedIn}
            setUserRole={setUserRole}
            setUserId={setUserId}
            userName={userName}
          />
          <div className="flex-1">
            <Routes>
              {/* Home Route */}
              <Route
                path="/"
                element={
                  <Home
                    isLoggedIn={isLoggedIn}
                    userRole={userRole}
                    setIsLoggedIn={setIsLoggedIn}
                    setUserRole={setUserRole}
                    setUserId={setUserId}
                  />
                }
              />

              {/* Admin Routes */}
              <Route path="/admin/register" element={<AdminRegister />} />
              <Route
                path="/admin/login"
                element={
                  <AdminLogin
                    setIsLoggedIn={setIsLoggedIn}
                    setUserRole={setUserRole}
                    setUserId={setUserId}
                  />
                }
              />
              <Route
                path="/admin/dashboard"
                element={
                  isLoggedIn && userRole === 'ADMIN' ? (
                    <AdminDashboard />
                  ) : (
                    <Navigate to="/admin/login" />
                  )
                }
              />

              {/* Dashboard Route */}
              <Route
                path="/dashboard"
                element={
                  isLoggedIn ? (
                    userRole === 'ADMIN' ? (
                      <Navigate to="/admin/dashboard" />
                    ) : (
                      <Dashboard
                        setIsLoggedIn={setIsLoggedIn}
                        userRole={userRole}
                        userId={userId}
                      />
                    )
                  ) : (
                    <Navigate to="/" />
                  )
                }
              />

              {/* Chat Route */}
              <Route path="/chat/:sessionId" element={<SessionRequests />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'hsl(var(--card))',
                color: 'hsl(var(--foreground))',
                border: '1px solid hsl(var(--border))',
                fontSize: '14px',
              },
            }}
          />
        </div>
      </Router>
    </ThemeProvider>
  );
};

export default App;
