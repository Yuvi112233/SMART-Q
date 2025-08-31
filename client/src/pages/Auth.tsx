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
      password: "",
      confirmPassword: "",
      role: "customer",
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
      setLocation(data.user.role === 'salon' ? '/dashboard' : '/');
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
    mutationFn: api.auth.register,
    onSuccess: (data) => {
      login(data.user, data.token);
      toast({
        title: "Welcome to SmartQ!",
        description: "Your account has been created successfully.",
      });
      setLocation(data.user.role === 'salon' ? '/dashboard' : '/');
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
    console.log('Sending to API:', userData);
    registerMutation.mutate(userData);
  };

  return (
    <div className="min-h-screen gradient-pink flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-foreground">
            {isLogin ? "Welcome back" : "Create your account"}
          </CardTitle>
          <CardDescription>
            {isLogin 
              ? "Sign in to your SmartQ account" 
              : "Join SmartQ and skip the wait"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLogin ? (
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="login-email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <Input 
                  id="login-email"
                  type="email" 
                  placeholder="Enter your email" 
                  {...loginForm.register("email")}
                  data-testid="input-email"
                />
                {loginForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="login-password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <Input 
                  id="login-password"
                  type="password" 
                  placeholder="Enter your password" 
                  {...loginForm.register("password")}
                  data-testid="input-password"
                />
                {loginForm.formState.errors.password && (
                  <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          ) : (
            <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="register-name" className="text-sm font-medium text-foreground">
                  Full Name
                </label>
                <Input 
                  id="register-name"
                  placeholder="Enter your full name" 
                  {...registerForm.register("name")}
                  data-testid="input-name"
                />
                {registerForm.formState.errors.name && (
                  <p className="text-sm text-destructive">{registerForm.formState.errors.name.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="register-email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <Input 
                  id="register-email"
                  type="email" 
                  placeholder="Enter your email" 
                  {...registerForm.register("email")}
                  data-testid="input-email"
                />
                {registerForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{registerForm.formState.errors.email.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="register-role" className="text-sm font-medium text-foreground">
                  Account Type
                </label>
                <Select 
                  onValueChange={(value) => registerForm.setValue("role", value as "customer" | "salon")}
                  defaultValue={registerForm.getValues("role")}
                >
                  <SelectTrigger id="register-role" data-testid="select-role">
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="salon">Salon Owner</SelectItem>
                  </SelectContent>
                </Select>
                {registerForm.formState.errors.role && (
                  <p className="text-sm text-destructive">{registerForm.formState.errors.role.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="register-password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <Input 
                  id="register-password"
                  type="password" 
                  placeholder="Create a password" 
                  {...registerForm.register("password")}
                  data-testid="input-password"
                />
                {registerForm.formState.errors.password && (
                  <p className="text-sm text-destructive">{registerForm.formState.errors.password.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="register-confirm-password" className="text-sm font-medium text-foreground">
                  Confirm Password
                </label>
                <Input 
                  id="register-confirm-password"
                  type="password" 
                  placeholder="Confirm your password" 
                  {...registerForm.register("confirmPassword")}
                  data-testid="input-confirm-password"
                />
                {registerForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">{registerForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={registerMutation.isPending}
                data-testid="button-register"
              >
                {registerMutation.isPending ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              className="text-sm"
              onClick={() => {
                setIsLogin(!isLogin);
                // Only reset the form that's being switched to
                if (isLogin) {
                  registerForm.reset();
                } else {
                  loginForm.reset();
                }
              }}
              data-testid="button-toggle-auth"
            >
              {isLogin 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Sign in"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}