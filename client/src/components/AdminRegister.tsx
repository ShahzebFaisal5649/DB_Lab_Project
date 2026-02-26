
import React from 'react';
import { API_BASE_URL } from '../config';
import { useNavigate } from 'react-router-dom';
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "./ui/form";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type FormData = z.infer<typeof formSchema>;

const AdminRegister: React.FC = () => {
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit: SubmitHandler<FormData> = async (values) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, role: 'ADMIN' }), // Set role to 'ADMIN'
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMessage('Admin registration successful!');
        setErrorMessage(null);
        setTimeout(() => {
          navigate('/admin/login');
        }, 2000);
      } else {
        setSuccessMessage(null);
        setErrorMessage(data.message || `Registration failed (Status: ${response.status})`);
      }
    } catch (error: any) {
      console.error('Error registering admin:', error);
      console.log('Attempted API URL:', `${API_BASE_URL}/api/users/register`);
      setSuccessMessage(null);
      setErrorMessage(`Network error or backend unreachable. Error: ${error.message}. API: ${API_BASE_URL}`);
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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin Registration</h1>
          <p className="text-sm text-muted-foreground">Create an EDUConnect admin account</p>
        </div>

        {/* Alerts */}
        {successMessage && (
          <div className="rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Admin name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            <Button type="submit" className="w-full">Register Admin</Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default AdminRegister;
