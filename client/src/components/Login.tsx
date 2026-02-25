// client/src/components/Login.tsx

import React, { useState } from 'react';
import { API_BASE_URL } from '../config';
import { useNavigate } from 'react-router-dom';
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Eye, EyeOff, Lock, Mail, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type FormData = z.infer<typeof formSchema>;

interface LoginProps {
  setIsLoggedIn: (value: boolean) => void;
  setUserRole: (role: string | null) => void;
  setUserId: (id: string | null) => void;
}

const perks = [
  'Access 500+ verified expert tutors',
  'Real-time chat with your tutor',
  'Flexible scheduling anytime',
  'Personalized learning experience',
];

const Login: React.FC<LoginProps> = ({ setIsLoggedIn, setUserRole, setUserId }) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
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
        localStorage.setItem('userId', data.user.id);
        if (data.user.name) localStorage.setItem('userName', data.user.name);
        setIsLoggedIn(true);
        setUserRole(data.user.role);
        setUserId(data.user.id);
        toast.success('Welcome back!');
        if (data.user.role === 'ADMIN' || data.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        toast.error(data.message || 'Invalid credentials. Please try again.');
      }
    } catch (error) {
      toast.error('Connection error. Please check your network.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground text-sm">Sign in to your EDUConnect account</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email address</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10"
                      {...field}
                    />
                  </div>
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
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    tabIndex={-1}
                  >
                    Forgot password?
                  </button>
                </div>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      className="pl-10 pr-10"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full h-11"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>
      </Form>

      <div className="p-4 rounded-xl bg-secondary/50 border border-border space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Why EDUConnect?</p>
        <ul className="space-y-1.5">
          {perks.map((perk, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
              {perk}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Login;
