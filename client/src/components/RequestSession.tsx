// client/src/components/RequestSession.tsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";

interface Tutor {
  _id: string;
  name: string;
  subjects: string[];
}

interface RequestSessionProps {
  userId: string | null;
}

const sessionRequestSchema = z.object({
  tutorId: z.string().nonempty({ message: "Please select a tutor" }),
  subject: z.string().nonempty({ message: "Please enter a subject" }),
  requestedTime: z.string().nonempty({ message: "Please select a time" }),
});

type SessionRequestData = z.infer<typeof sessionRequestSchema>;

const RequestSession: React.FC<RequestSessionProps> = ({ userId }) => {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const form = useForm<SessionRequestData>({
    resolver: zodResolver(sessionRequestSchema),
    defaultValues: {
      tutorId: '',
      subject: '',
      requestedTime: '',
    },
  });

  // Fetch the list of available tutors
  useEffect(() => {
    const fetchTutors = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/users/tutors');
        const data = await response.json();
        if (response.ok) {
          setTutors(data.tutors);
        } else {
          alert(data.message || 'Failed to fetch tutors');
        }
      } catch (error) {
        console.error('Error fetching tutors:', error);
        alert('An error occurred while fetching tutors.');
      } finally {
        setLoading(false);
      }
    };

    fetchTutors();
  }, []);

  // Handle form submission
  const onSubmit: SubmitHandler<SessionRequestData> = async (values) => {
    try {
      const response = await fetch('http://localhost:5000/api/users/session/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, studentId: userId }),
      });

      const data = await response.json();
      if (response.ok) {
        alert('Session request submitted successfully!');
        navigate('/dashboard');
      } else {
        alert(data.message || 'Failed to submit session request');
      }
    } catch (error) {
      console.error('Error submitting session request:', error);
      alert('An error occurred while submitting the session request.');
    }
  };

  if (loading) {
    return <p>Loading available tutors...</p>;
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-lg p-8 space-y-6 rounded-xl bg-white shadow-lg">
        <h1 className="text-3xl font-bold text-center">Request a Session</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Tutor Selection */}
            <FormField
              control={form.control}
              name="tutorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Tutor</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a tutor" />
                      </SelectTrigger>
                      <SelectContent>
                        {tutors.map((tutor) => (
                          <SelectItem key={tutor._id} value={tutor._id}>
                            {tutor.name} - {tutor.subjects.join(', ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Subject Field */}
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter the subject" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Requested Time Field */}
            <FormField
              control={form.control}
              name="requestedTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requested Time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <Button type="submit" className="w-full">
              Submit Request
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default RequestSession;