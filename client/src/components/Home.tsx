import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import Login from './Login';
import Register from './Register';

interface HomeProps {
  isLoggedIn: boolean;
  userRole: string | null;
  setIsLoggedIn: (value: boolean) => void;
  setUserRole: (role: string | null) => void;
  setUserId: (id: string | null) => void;
}

export function Home({ isLoggedIn, userRole, setIsLoggedIn, setUserRole, setUserId }: HomeProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-100 to-white p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-blue-600">Welcome to Edu Connect</CardTitle>
          <CardDescription>Empowering education through connectivity</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoggedIn ? (
            <div className="space-y-4">
              <p className="text-center text-lg">
                Welcome back, {userRole === 'ADMIN' ? 'Admin' : userRole === 'TUTOR' ? 'Tutor' : 'Student'}!
              </p>
              <Link to={userRole === 'ADMIN' ? "/admin/dashboard" : "/dashboard"} className="block w-full">
                <Button variant="default" className="w-full">
                  Go to {userRole === 'ADMIN' ? 'Admin' : userRole === 'TUTOR' ? 'Tutor' : 'Student'} Dashboard
                </Button>
              </Link>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "register")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <Login
                  setIsLoggedIn={setIsLoggedIn}
                  setUserRole={setUserRole}
                  setUserId={setUserId}
                />
              </TabsContent>
              <TabsContent value="register">
                <Register
                  setIsLoggedIn={setIsLoggedIn}
                  setUserRole={setUserRole}
                  setUserId={setUserId}
                />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      <footer className="mt-8 text-center text-sm text-gray-600">
        <p>© 2024 Edu Connect. All rights reserved.</p>
        <p className="mt-2">Connecting students and tutors worldwide.</p>
      </footer>
    </div>
  );
}

export default Home;