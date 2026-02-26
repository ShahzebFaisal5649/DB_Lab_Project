// client/src/components/AdminLogin.tsx

import React, { useState } from 'react';
import { API_BASE_URL } from '../config';
import { useNavigate } from 'react-router-dom';
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import toast from 'react-hot-toast';

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
});

type FormData = z.infer<typeof formSchema>;

interface AdminLoginProps {
  setIsLoggedIn: (value: boolean) => void;
  setUserRole: (role: string | null) => void;
  setUserId: (id: string | null) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ setIsLoggedIn, setUserRole, setUserId }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit: SubmitHandler<FormData> = async (values) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userRole', data.user.role);
        localStorage.setItem('userId', String(data.user.id));
        if (data.user.name) localStorage.setItem('userName', data.user.name);
        setIsLoggedIn(true);
        setUserRole(data.user.role);
        setUserId(String(data.user.id));
        toast.success('Welcome back!');
        if (data.user.role.toLowerCase() === "admin") {
          navigate('/admin/dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        toast.error(data.message || 'Invalid credentials. Please try again.');
      }
    } catch (error) {
      console.error('Error logging in:', error);
      toast.error('Connection error. Please check your network.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 space-y-6 rounded-xl border border-border bg-card shadow-sm">
        {/* Header */}
        <div className="space-y-1 text-center">
          <div className="flex justify-center mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">A</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin Login</h1>
          <p className="text-sm text-muted-foreground">Sign in to the EDUConnect admin panel</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="admin@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full h-11" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default AdminLogin;