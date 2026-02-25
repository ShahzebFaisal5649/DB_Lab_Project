import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { useNavigate } from 'react-router-dom';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler } from "react-hook-form";
import * as z from "zod";
import axios from 'axios';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "./ui/form";
import { Progress } from "./ui/progress";
import { Eye, EyeOff, GraduationCap, User2, BookOpen, ArrowLeft, ArrowRight, CheckCircle2, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const times = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
const countries = ['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Japan', 'India', 'Pakistan'];

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  role: z.enum(["STUDENT", "TUTOR"]),
  subjects: z.array(z.string()).optional(),
  country: z.string().optional(),
  availability: z.array(z.object({ day: z.string(), time: z.string() })).optional(),
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

const TOTAL_STEPS = 3;

const Register: React.FC<RegisterProps> = ({ setIsLoggedIn, setUserRole, setUserId }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<"STUDENT" | "TUTOR">("STUDENT");
  const [availability, setAvailability] = useState<{ day: string; time: string }[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "", email: "", password: "", role: "STUDENT",
      subjects: [], country: "", availability: [],
      learningGoals: "", preferredSubjects: [],
    },
  });

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/users/subjects`);
        if (response.data?.subjects) setSubjects(response.data.subjects);
      } catch (error) {
        console.error('Error fetching subjects:', error);
      }
    };
    fetchSubjects();
  }, []);

  const handleAvailabilityChange = (day: string, time: string) => {
    setAvailability(prev => {
      const exists = prev.some(a => a.day === day && a.time === time);
      if (exists) return prev.filter(a => !(a.day === day && a.time === time));
      return [...prev, { day, time }];
    });
  };

  const handleRoleChange = (r: "STUDENT" | "TUTOR") => {
    setRole(r);
    form.setValue('role', r);
  };

  const validateStep1 = async () => {
    const valid = await form.trigger(['name', 'email', 'password', 'role']);
    return valid;
  };

  const validateStep2 = async () => {
    if (role === 'TUTOR') {
      return await form.trigger(['subjects', 'country']);
    }
    return await form.trigger(['learningGoals', 'preferredSubjects']);
  };

  const handleNext = async () => {
    if (step === 1) {
      if (await validateStep1()) setStep(2);
    } else if (step === 2) {
      if (await validateStep2()) setStep(3);
    }
  };

  const onSubmit: SubmitHandler<FormData> = async (values) => {
    setIsLoading(true);
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
      const response = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userRole', values.role);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('userName', values.name);
        setIsLoggedIn(true);
        setUserRole(values.role);
        setUserId(data.userId);
        toast.success('Account created successfully!');
        navigate('/dashboard');
      } else {
        toast.error(data.message || `Registration failed`);
      }
    } catch (error: any) {
      toast.error(`Network error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const progressValue = ((step - 1) / (TOTAL_STEPS - 1)) * 100;

  const stepLabels = ['Basic Info', role === 'TUTOR' ? 'Expertise' : 'Learning', 'Review'];

  const formValues = form.watch();

  return (
    <div className="w-full space-y-6">
      {/* Step Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Step {step} of {TOTAL_STEPS} — {stepLabels[step - 1]}</p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            {Math.round(progressValue)}% complete
          </div>
        </div>
        <Progress value={progressValue} className="h-1.5" />
        <div className="flex justify-between">
          {stepLabels.map((label, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                i + 1 < step ? 'bg-primary text-primary-foreground' :
                i + 1 === step ? 'bg-primary text-primary-foreground' :
                'bg-secondary text-muted-foreground'
              }`}>
                {i + 1 < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={`text-xs hidden sm:block ${i + 1 === step ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="Your full name" className="pl-10" {...field} />
                      </div>
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
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input type="email" placeholder="you@example.com" className="pl-10" {...field} />
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Min. 6 characters"
                          className="pl-10 pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(s => !s)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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

              {/* Role Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">I am a...</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'STUDENT', label: 'Student', desc: 'I want to learn', icon: <BookOpen className="w-5 h-5" /> },
                    { value: 'TUTOR', label: 'Tutor', desc: 'I want to teach', icon: <GraduationCap className="w-5 h-5" /> },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleRoleChange(opt.value as "STUDENT" | "TUTOR")}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        role === opt.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50 bg-card'
                      }`}
                    >
                      <div className="mb-2">{opt.icon}</div>
                      <div className="font-semibold text-sm">{opt.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Role-specific */}
          {step === 2 && role === 'TUTOR' && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm text-primary">
                <strong>Tutor Setup:</strong> Tell students about your expertise.
              </div>

              <FormField
                control={form.control}
                name="subjects"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subjects of Expertise</FormLabel>
                    <Select onValueChange={(value) => field.onChange([value])}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your main subject" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subjects.map((s) => s.name ? (
                          <SelectItem key={s._id} value={s.name}>{s.name}</SelectItem>
                        ) : null)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {countries.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <label className="text-sm font-medium">Weekly Availability</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {days.map((day) => (
                    <Select key={day} onValueChange={(time) => handleAvailabilityChange(day, time)}>
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder={day.slice(0, 3)} />
                      </SelectTrigger>
                      <SelectContent>
                        {times.map((time) => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ))}
                </div>
                {availability.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {availability.map(({ day, time }) => (
                      <span
                        key={`${day}-${time}`}
                        onClick={() => handleAvailabilityChange(day, time)}
                        className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
                      >
                        {day.slice(0, 3)} {time} ×
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && role === 'STUDENT' && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm text-primary">
                <strong>Student Setup:</strong> Help us match you with the right tutors.
              </div>

              <FormField
                control={form.control}
                name="learningGoals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Learning Goals</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Prepare for SAT, improve calculus..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preferredSubjects"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Subjects</FormLabel>
                    <Select onValueChange={(value) => field.onChange([value])}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a subject you need help with" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subjects.map((s) => s.name ? (
                          <SelectItem key={s._id} value={s.name}>{s.name}</SelectItem>
                        ) : null)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-secondary/50 border border-border text-sm">
                <strong>Review your details before creating your account.</strong>
              </div>
              <div className="space-y-3 divide-y divide-border">
                {[
                  { label: 'Name', value: formValues.name },
                  { label: 'Email', value: formValues.email },
                  { label: 'Role', value: formValues.role },
                  ...(role === 'TUTOR' ? [
                    { label: 'Subjects', value: (formValues.subjects || []).join(', ') || '—' },
                    { label: 'Country', value: formValues.country || '—' },
                    { label: 'Availability slots', value: `${availability.length} slot(s)` },
                  ] : [
                    { label: 'Learning Goals', value: formValues.learningGoals || '—' },
                    { label: 'Preferred Subjects', value: (formValues.preferredSubjects || []).join(', ') || '—' },
                  ]),
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-2.5 text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-right max-w-[180px] truncate">{value}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                By creating an account, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 pt-2">
            {step > 1 && (
              <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(s => s - 1)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            )}
            {step < TOTAL_STEPS ? (
              <Button
                type="button"
                className="flex-1"
                onClick={handleNext}
              >
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="submit"
                className="flex-1 h-11"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Create Account
                  </span>
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
};

export default Register;
