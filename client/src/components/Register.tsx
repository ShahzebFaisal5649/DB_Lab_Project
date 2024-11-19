import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler } from "react-hook-form";
import * as z from "zod";
import axios from 'axios';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "./ui/form";
import { Alert } from './ui/alert';

// Constants for days, times, and countries
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const times = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
const countries = ['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Japan', 'India', 'Pakistan'];

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  role: z.enum(["STUDENT", "TUTOR"]),
  subjects: z.array(z.string()).optional(),
  country: z.string(),
  availability: z.array(z.object({
    day: z.string(),
    time: z.string(),
  })).optional(),
  learningGoals: z.string().optional(),
  preferredSubjects: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface RegisterProps {
  setIsLoggedIn: (value: boolean) => void;
  setUserRole: (role: string) => void;
  setUserId: (id: string) => void;
}

interface Subject {
  _id: string;
  name: string;
}

const Register: React.FC<RegisterProps> = ({ setIsLoggedIn, setUserRole, setUserId }) => {
  const navigate = useNavigate();
  const [role, setRole] = useState<"STUDENT" | "TUTOR">("STUDENT");
  const [availability, setAvailability] = useState<{ day: string, time: string }[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchSubjects = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/users/subjects');
      if (response.data && response.data.subjects) {
        setSubjects(response.data.subjects);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "STUDENT",
      subjects: [],
      country: "",
      availability: [],
      learningGoals: "",
      preferredSubjects: [],
    },
  });

  const onSubmit: SubmitHandler<FormData> = async (values) => {
    values.availability = availability;

    const requestData = {
      name: values.name,
      email: values.email,
      password: values.password,
      role: values.role,
      ...(values.role === "TUTOR" && {
        subjects: values.subjects,
        availability: values.availability,
        country: values.country,
      }),
      ...(values.role === "STUDENT" && {
        learningGoals: values.learningGoals,
        preferredSubjects: values.preferredSubjects,
      }),
    };

    try {
      const response = await fetch('http://localhost:5000/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMessage('Registration successful!');
        setErrorMessage(null);

        setIsLoggedIn(true);
        setUserRole(values.role);
        setUserId(data.userId);

        navigate('/dashboard');
      } else {
        setSuccessMessage(null);
        setErrorMessage(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Error registering user:', error);
      setSuccessMessage(null);
      setErrorMessage('An error occurred during registration.');
    }
  };

  const handleAvailabilityChange = (day: string, time: string) => {
    const newAvailability = availability.filter(a => a.day !== day || a.time !== time);
    if (newAvailability.length === availability.length) {
      newAvailability.push({ day, time });
    }
    setAvailability(newAvailability);
  };

  const removeAvailability = (day: string, time: string) => {
    setAvailability(availability.filter(a => !(a.day === day && a.time === time)));
  };

  const handleRoleChange = (selectedRole: string) => {
    const roleValue = selectedRole.toUpperCase() as "STUDENT" | "TUTOR";
    setRole(roleValue);
    form.setValue('role', roleValue);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-lg p-8 space-y-6 rounded-xl bg-white shadow-lg">
        <h1 className="text-3xl font-bold text-center">Register for Edu Connect</h1>

        {successMessage && <Alert variant="default">{successMessage}</Alert>}
        {errorMessage && <Alert variant="destructive">{errorMessage}</Alert>}

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

            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Your email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password Field */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Your password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Role Selection */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleRoleChange(value);
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="tutor">Tutor</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Conditional Fields for Tutors */}
            {role === 'TUTOR' && (
              <>
                {/* Subjects of Expertise (Dropdown) */}
                <FormField
                  control={form.control}
                  name="subjects"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subjects of Expertise</FormLabel>
                      <Select onValueChange={(value) => field.onChange([value])}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a subject" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subjects.map((subject: Subject) => (
                            <SelectItem key={subject._id} value={subject.name}>
                              {subject.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Country Selection */}
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country} value={country}>{country}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Availability Selection */}
                <FormItem>
                  <FormLabel>Availability</FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {days.map((day) => (
                      <Select key={day} onValueChange={(time) => handleAvailabilityChange(day, time)}>
                        <SelectTrigger>
                          <SelectValue placeholder={`${day}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {times.map((time) => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ))}
                  </div>

                  {/* Display Selected Availabilities with Remove Option */}
                  <div className="mt-4 space-y-2">
                    {availability.map(({ day, time }) => (
                      <div key={`${day}-${time}`} className="flex justify-between items-center">
                        <span>{day}, {time}</span>
                        <Button variant="outline" onClick={() => removeAvailability(day, time)}>
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </FormItem>
              </>
            )}

            {/* Conditional Fields for Students */}
            {role === 'STUDENT' && (
              <>
                {/* Learning Goals */}
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

                {/* Preferred Subjects (Dropdown) */}
                <FormField
                  control={form.control}
                  name="preferredSubjects"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Subjects</FormLabel>
                      <Select onValueChange={(value) => field.onChange([value])}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a subject" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subjects.map((subject: Subject) => (
                            <SelectItem key={subject._id} value={subject.name}>
                              {subject.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Submit Button */}
            <Button type="submit" className="w-full">Register</Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default Register;