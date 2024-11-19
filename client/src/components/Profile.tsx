// client/src/components/Profile.tsx

import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";

interface ProfileProps {
  userId: string | null;
}

const profileSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  // Additional fields based on the user role
  subjects: z.array(z.string()).optional(),
  location: z.string().optional(),
  availability: z.array(z.string()).optional(),
  verificationDocument: z.string().optional(),
  mcqTestScore: z.number().optional(),
  learningGoals: z.string().optional(),
  preferredSubjects: z.array(z.string()).optional(),
  preferences: z.string().optional(),
});

type ProfileData = z.infer<typeof profileSchema>;

const Profile: React.FC<ProfileProps> = ({ userId }) => {
  const [profile, setProfile] = useState<ProfileData | null>(null); // Initial profile data
  const [role, setRole] = useState<string>(''); // User role (student/tutor)

  const form = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      subjects: [],
      location: '',
      availability: [],
      verificationDocument: '',
      mcqTestScore: undefined,
      learningGoals: '',
      preferredSubjects: [],
      preferences: '',
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (userId) {
        try {
          const response = await fetch(`http://localhost:5000/api/users/profile/${userId}`);
          const data = await response.json();
          if (response.ok) {
            setProfile(data.user);
            setRole(data.user.role);
            form.reset({
              name: data.user.name,
              subjects: data.user.subjects || [],
              location: data.user.location || '',
              availability: data.user.availability || [],
              verificationDocument: data.user.verificationDocument || '',
              mcqTestScore: data.user.mcqTestScore || undefined,
              learningGoals: data.user.learningGoals || '',
              preferredSubjects: data.user.preferredSubjects || [],
              preferences: data.user.preferences || '',
            });
          } else {
            console.error('Failed to fetch profile:', data.message);
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      }
    };

    fetchProfile();
  }, [userId, form]);

  const onSubmit: SubmitHandler<ProfileData> = async (values) => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/profile/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json();
      if (response.ok) {
        alert('Profile updated successfully!');
        setProfile(data.user);
      } else {
        alert(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('An error occurred during profile update.');
    }
  };

  if (!profile) {
    return <p>Loading profile...</p>;
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-lg p-8 space-y-6 rounded-xl bg-white shadow-lg">
        <h1 className="text-3xl font-bold text-center">Update Profile</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Conditional fields for Tutors */}
            {role === 'tutor' && (
              <>
                {/* Subjects Field */}
                <FormField
                  control={form.control}
                  name="subjects"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subjects</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Math, Physics"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value.split(',').map((s) => s.trim()))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Location Field */}
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Your location" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Availability Field */}
                <FormField
                  control={form.control}
                  name="availability"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Availability</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Monday 9-11 AM, Wednesday 2-4 PM"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value.split(',').map((s) => s.trim()))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Verification Document Field */}
                <FormField
                  control={form.control}
                  name="verificationDocument"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Document</FormLabel>
                      <FormControl>
                        <Input type="url" placeholder="Document URL" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* MCQ Test Score Field */}
                <FormField
                  control={form.control}
                  name="mcqTestScore"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>MCQ Test Score</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Test score" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Conditional fields for Students */}
            {role === 'student' && (
              <>
                {/* Learning Goals Field */}
                <FormField
                  control={form.control}
                  name="learningGoals"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Learning Goals</FormLabel>
                      <FormControl>
                        <Input placeholder="Your learning goals" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Preferred Subjects Field */}
                <FormField
                  control={form.control}
                  name="preferredSubjects"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Subjects</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Chemistry, Biology"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value.split(',').map((s) => s.trim()))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Preferences Field */}
                <FormField
                  control={form.control}
                  name="preferences"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Preferences</FormLabel>
                      <FormControl>
                        <Input placeholder="Any additional preferences" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Submit Button */}
            <Button type="submit" className="w-full">
              Update Profile
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default Profile;