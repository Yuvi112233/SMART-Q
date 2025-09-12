import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { insertUserSchema, loginSchema } from "@shared/schema";
import { Eye, EyeOff, Sparkles, User, Mail, Phone, Lock, UserCheck, ArrowLeft, Home } from "lucide-react";

const registerFormSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerFormSchema>;
type LoginForm = z.infer<typeof loginSchema>;

export default function Auth() {
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange",
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      role: "customer", // Default role
    },
    mode: "onChange",
  });

  // Debug: Monitor form values
  useEffect(() => {
    console.log('Login form values:', loginForm.watch());
  }, [loginForm.watch()]);

  useEffect(() => {
    console.log('Register form values:', registerForm.watch());
  }, [registerForm.watch()]);

  const loginMutation = useMutation({
    mutationFn: api.auth.login,
    onSuccess: (data) => {
      login(data.user, data.token);
      toast({
        title: "Welcome back!",
        description: "You've been successfully logged in.",
      });
      setLocation(data.user.role === 'salon_owner' ? '/dashboard' : '/');
    },
    onError: (error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: (userData) => {
      // Ensure role is explicitly set to "salon_owner" for salon owners
      if (userData.role === "salon") {
        userData.role = "salon_owner";
      }
      console.log("Sending registration with role:", userData.role);
      return api.auth.register(userData);
    },
    onSuccess: (data) => {
      login(data.user, data.token);
      toast({
        title: "Welcome to SmartQ!",
        description: "Your account has been created successfully.",
      });
      setLocation(data.user.role === 'salon_owner' ? '/dashboard' : '/');
    },
    onError: (error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onLoginSubmit = (data: LoginForm) => {
    console.log('Login form submitted with:', data);
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterForm) => {
    console.log('Register form submitted with:', data);
    const { confirmPassword, ...userData } = data;
    
    // Force set the role to "salon" if salon owner is selected
    if (userData.role === "salon") {
      console.log('Setting role to salon for salon owner');
    } else {
      console.log('Keeping role as customer');
    }
    
    console.log('Sending to API with role:', userData.role);
    registerMutation.mutate(userData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Home Button */}
      <button
        onClick={() => setLocation("/")}
        className="absolute top-6 left-6 z-20 flex items-center justify-center w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-white/20 hover:bg-white hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        aria-label="Go to home page"
      >
        <ArrowLeft className="w-5 h-5 text-gray-700" />
      </button>

      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-pink-300/10 to-purple-300/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* App Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl mb-4 shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            SmartQ
          </h1>
          <p className="text-gray-600 text-sm mt-1">Skip the wait, book your spot</p>
        </div>

        {/* Auth Toggle Tabs */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-1 mb-6 shadow-lg border border-white/20">
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => {
                setIsLogin(true);
                registerForm.reset();
                setShowPassword(false);
                setShowConfirmPassword(false);
              }}
              className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ${
                isLogin
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                loginForm.reset();
                setShowPassword(false);
                setShowConfirmPassword(false);
              }}
              className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ${
                !isLogin
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Main Auth Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {isLogin ? "Welcome back!" : "Join SmartQ"}
              </h2>
              <p className="text-gray-600">
                {isLogin 
                  ? "Sign in to your account to continue" 
                  : "Create your account and start skipping queues"}
              </p>
            </div>

            {isLogin ? (
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                {/* Email Input */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </label>
                  <div className="relative">
                    <Input 
                      type="email" 
                      placeholder="Enter your email address"
                      className="h-14 pl-4 pr-4 text-base rounded-2xl border-2 border-gray-200 focus:border-purple-500 focus:ring-0 bg-gray-50/50 transition-all duration-300"
                      {...loginForm.register("email")}
                      data-testid="input-email"
                    />
                  </div>
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Password
                  </label>
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="h-14 pl-4 pr-12 text-base rounded-2xl border-2 border-gray-200 focus:border-purple-500 focus:ring-0 bg-gray-50/50 transition-all duration-300"
                      {...loginForm.register("password")}
                      data-testid="input-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                {/* Sign In Button */}
                <Button 
                  type="submit" 
                  disabled={loginMutation.isPending}
                  className="w-full h-14 text-base font-semibold rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Signing in...
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-5">
                {/* Full Name Input */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Full Name
                  </label>
                  <Input 
                    placeholder="Enter your full name"
                    className="h-14 pl-4 pr-4 text-base rounded-2xl border-2 border-gray-200 focus:border-purple-500 focus:ring-0 bg-gray-50/50 transition-all duration-300"
                    {...registerForm.register("name")}
                    data-testid="input-name"
                  />
                  {registerForm.formState.errors.name && (
                    <p className="text-sm text-red-500">{registerForm.formState.errors.name.message}</p>
                  )}
                </div>

                {/* Email Input */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </label>
                  <Input 
                    type="email" 
                    placeholder="Enter your email address"
                    className="h-14 pl-4 pr-4 text-base rounded-2xl border-2 border-gray-200 focus:border-purple-500 focus:ring-0 bg-gray-50/50 transition-all duration-300"
                    {...registerForm.register("email")}
                    data-testid="input-email"
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-sm text-red-500">{registerForm.formState.errors.email.message}</p>
                  )}
                </div>

                {/* Phone Input */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone Number
                  </label>
                  <Input 
                    type="tel" 
                    placeholder="Enter your phone number"
                    className="h-14 pl-4 pr-4 text-base rounded-2xl border-2 border-gray-200 focus:border-purple-500 focus:ring-0 bg-gray-50/50 transition-all duration-300"
                    {...registerForm.register("phone")}
                    data-testid="input-phone"
                  />
                  {registerForm.formState.errors.phone && (
                    <p className="text-sm text-red-500">{registerForm.formState.errors.phone.message}</p>
                  )}
                </div>

                {/* Account Type Select */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <UserCheck className="w-4 h-4" />
                    Account Type
                  </label>
                  <Select 
                    defaultValue="customer" 
                    onValueChange={(value) => registerForm.setValue("role", value === "salon" ? "salon_owner" : value)}
                    data-testid="select-role"
                  >
                    <SelectTrigger className="h-14 text-base rounded-2xl border-2 border-gray-200 focus:border-purple-500 focus:ring-0 bg-gray-50/50">
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2">
                      <SelectItem value="customer" className="text-base py-3">Customer</SelectItem>
                      <SelectItem value="salon" className="text-base py-3">Salon Owner</SelectItem>
                    </SelectContent>
                  </Select>
                  {registerForm.formState.errors.role && (
                    <p className="text-sm text-red-500">{registerForm.formState.errors.role.message}</p>
                  )}
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Password
                  </label>
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      className="h-14 pl-4 pr-12 text-base rounded-2xl border-2 border-gray-200 focus:border-purple-500 focus:ring-0 bg-gray-50/50 transition-all duration-300"
                      {...registerForm.register("password")}
                      data-testid="input-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {registerForm.formState.errors.password && (
                    <p className="text-sm text-red-500">{registerForm.formState.errors.password.message}</p>
                  )}
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Input 
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      className="h-14 pl-4 pr-12 text-base rounded-2xl border-2 border-gray-200 focus:border-purple-500 focus:ring-0 bg-gray-50/50 transition-all duration-300"
                      {...registerForm.register("confirmPassword")}
                      data-testid="input-confirm-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {registerForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-red-500">{registerForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                {/* Create Account Button */}
                <Button 
                  type="submit" 
                  disabled={registerMutation.isPending}
                  className="w-full h-14 text-base font-semibold rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] mt-6"
                  data-testid="button-register"
                >
                  {registerMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Creating account...
                    </div>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Footer Text */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            By continuing, you agree to SmartQ's{" "}
            <span className="text-purple-600 font-medium">Terms of Service</span> and{" "}
            <span className="text-purple-600 font-medium">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
}