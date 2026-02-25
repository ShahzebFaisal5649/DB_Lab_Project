import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, BookOpen, LogOut, Menu, Moon, Sun, User, X, ChevronDown, GraduationCap } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { API_BASE_URL } from '../config';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';

interface NavbarProps {
  isLoggedIn: boolean;
  userRole: string | null;
  userId: string | null;
  setIsLoggedIn: (v: boolean) => void;
  setUserRole: (v: string | null) => void;
  setUserId: (v: string | null) => void;
  userName?: string | null;
}

interface Notification {
  id: number;
  student: { name: string };
  tutor: { name: string };
  subject: string;
  status: string;
  requestedTime: string;
}

const Navbar: React.FC<NavbarProps> = ({
  isLoggedIn, userRole, userId, setIsLoggedIn, setUserRole, setUserId, userName
}) => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoggedIn && userId) fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, userId]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchNotifications = async () => {
    try {
      const role = localStorage.getItem('userRole') || '';
      const res = await fetch(
        `${API_BASE_URL}/api/users/session-requests?role=${role}&userId=${userId}`,
        { headers: { 'user-id': userId || '' } }
      );
      if (res.ok) {
        const data = await res.json();
        const pending = (data.requests || []).filter((r: Notification) =>
          r.status?.toLowerCase() === 'pending'
        );
        setNotifications(pending);
      }
    } catch { /* silent */ }
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    setIsLoggedIn(false);
    setUserRole(null);
    setUserId(null);
    navigate('/');
    setUserMenuOpen(false);
  };

  const dashboardPath = userRole === 'ADMIN' ? '/admin/dashboard' : '/dashboard';
  const initials = userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">EDUConnect</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {isLoggedIn ? (
              <>
                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => { setNotifOpen(o => !o); setUserMenuOpen(false); }}
                    className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    <Bell className="w-4 h-4" />
                    {notifications.length > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
                    )}
                  </button>
                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
                      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                        <span className="font-semibold text-sm">Notifications</span>
                        {notifications.length > 0 && (
                          <Badge variant="secondary" className="text-xs">{notifications.length} pending</Badge>
                        )}
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                            No new notifications
                          </div>
                        ) : (
                          notifications.map(n => (
                            <Link
                              key={n.id}
                              to={dashboardPath}
                              onClick={() => setNotifOpen(false)}
                              className="flex flex-col gap-1 px-4 py-3 hover:bg-accent transition-colors border-b border-border/50 last:border-0"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                  <span className="text-sm font-medium">
                                    {userRole === 'TUTOR'
                                      ? `${n.student?.name} requested a session`
                                      : `Session with ${n.tutor?.name}`}
                                  </span>
                                </div>
                                <Badge variant="outline" className="text-xs shrink-0">Pending</Badge>
                              </div>
                              <span className="text-xs text-muted-foreground pl-3">{n.subject}</span>
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Menu */}
                <div className="relative" ref={userRef}>
                  <button
                    onClick={() => { setUserMenuOpen(o => !o); setNotifOpen(false); }}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-accent transition-colors"
                  >
                    <Avatar className="w-7 h-7">
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">{initials}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium hidden lg:block">{userName || 'User'}</span>
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
                      <div className="px-3 py-2 border-b border-border">
                        <p className="text-xs text-muted-foreground">Signed in as</p>
                        <p className="text-sm font-medium truncate">{userName}</p>
                      </div>
                      <Link
                        to={dashboardPath}
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <BookOpen className="w-4 h-4" /> Dashboard
                      </Link>
                      <Link
                        to="/profile"
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="w-4 h-4" /> Profile
                      </Link>
                      <div className="border-t border-border" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/?tab=login">
                  <Button variant="ghost" size="sm">Sign in</Button>
                </Link>
                <Link to="/?tab=register">
                  <Button size="sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent"
            onClick={() => setMobileOpen(o => !o)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border py-3 space-y-1">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
            {isLoggedIn ? (
              <>
                <Link
                  to={dashboardPath}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-accent"
                  onClick={() => setMobileOpen(false)}
                >
                  <BookOpen className="w-4 h-4" /> Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/?tab=login" className="block" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">Sign in</Button>
                </Link>
                <Link to="/?tab=register" className="block" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
