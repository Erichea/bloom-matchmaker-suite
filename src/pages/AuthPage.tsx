import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { createAdminUser } from "@/utils/createAdminUser";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Sparkles, Heart, UserPlus, LogIn } from "lucide-react";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signUpSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignInForm = z.infer<typeof signInSchema>;
type SignUpForm = z.infer<typeof signUpSchema>;

const AuthPage = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");
  const [showEmailConfirmationMessage, setShowEmailConfirmationMessage] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if user came from access code validation
  const hasValidAccessCode = sessionStorage.getItem('validAccessCode');

  useEffect(() => {
    if (hasValidAccessCode) {
      setActiveTab("signup");
    }
  }, [hasValidAccessCode]);

  const signInForm = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signUpForm = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleSignIn = async (data: SignInForm) => {
    setLoading(true);
    const { error } = await signIn(data.email, data.password);

    if (!error) {
      toast({
        title: "Welcome back! 👋",
        description: "Good to see you again.",
      });
      // Check if user has a complete profile, otherwise redirect to dashboard
      navigate("/client/dashboard");
    }
    setLoading(false);
  };

  const handleSignUp = async (data: SignUpForm) => {
    setLoading(true);
    const { error } = await signUp(data.email, data.password, data.firstName, data.lastName);

    if (!error) {
      // Clear access code from session storage after successful signup
      sessionStorage.removeItem('validAccessCode');

      toast({
        title: "Welcome to Bloom! 🎉",
        description: "Your account has been created. Let's get started!",
        duration: 4000,
      });

      // Redirect to client dashboard after a brief delay
      setTimeout(() => {
        navigate("/client/dashboard");
      }, 1500);
    }
    setLoading(false);
  };

  const handleCreateAdminUser = async () => {
    setLoading(true);
    const { error } = await createAdminUser();

    if (!error) {
      toast({
        title: "Admin User Created",
        description: "Admin user created with email: admin@bloom.com and password: admin123",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to create admin user. It may already exist.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };


  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md card-premium">
        <CardHeader className="text-center space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <Sparkles className="h-5 w-5 text-accent animate-float" />
              <CardTitle className="text-2xl font-light">Bloom</CardTitle>
              <Heart className="h-5 w-5 text-accent animate-pulse-soft" />
            </div>
            <div className="w-12 h-0.5 bg-accent mx-auto"></div>
          </div>
          <CardDescription className="text-muted-foreground font-light">Private introductions. Human-first.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {hasValidAccessCode ? (
              <TabsList className="grid w-full grid-cols-2 bg-muted">
                <TabsTrigger value="signin" className="font-medium flex items-center space-x-1.5">
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Sign In</span>
                </TabsTrigger>
                <TabsTrigger value="signup" className="font-medium flex items-center space-x-1.5">
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Sign Up</span>
                </TabsTrigger>
              </TabsList>
            ) : (
              <div className="text-center mb-6">
                <div className="inline-flex items-center space-x-2 bg-muted rounded-lg px-4 py-2">
                  <LogIn className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">Sign In</span>
                </div>
              </div>
            )}
            
            <TabsContent value="signin" className="space-y-4">
              {showEmailConfirmationMessage && (
                <div className="bg-accent/30 border border-accent/20 rounded-lg p-4 mb-6 animate-fade-in">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Heart className="h-4 w-4 text-accent animate-bounce-gentle" />
                    <p className="text-sm text-center text-foreground font-light">
                      Welcome! Check your email for confirmation, then sign in below.
                    </p>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    Didn't receive an email? Check your spam folder or contact support.
                  </p>
                </div>
              )}
              {!hasValidAccessCode && !showEmailConfirmationMessage && (
                <div className="bg-muted/50 border border-border rounded-lg p-4 mb-6">
                  <div className="text-center space-y-2">
                    <p className="text-sm text-foreground font-light">
                      Welcome back! Sign in to your account.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Need an account? You'll need an access code to get started.
                    </p>
                  </div>
                </div>
              )}
              <Form {...signInForm}>
                <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                  <FormField
                    control={signInForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signInForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter your password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="btn-premium w-full group" disabled={loading}>
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Signing in...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <LogIn className="h-4 w-4 mr-2 group-hover:translate-x-1 transition-transform" />
                        Sign In
                      </div>
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            {hasValidAccessCode && (
              <TabsContent value="signup" className="space-y-4">
                <div className="bg-accent/30 border border-accent/20 rounded-lg p-4 mb-6 animate-fade-in">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Heart className="h-4 w-4 text-accent animate-bounce-gentle" />
                    <p className="text-sm text-center text-foreground font-light">
                      Welcome! Create your account to get started.
                    </p>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    Already have an account?
                    <button
                      type="button"
                      onClick={() => setActiveTab("signin")}
                      className="text-primary hover:underline ml-1 font-medium transition-all hover:animate-wiggle"
                    >
                      Sign in here
                    </button>
                  </p>
                </div>
                <Form {...signUpForm}>
                <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={signUpForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="First name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signUpForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Last name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={signUpForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signUpForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter your password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signUpForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Confirm your password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="btn-premium w-full group" disabled={loading}>
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Creating account...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <UserPlus className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                        Create Account
                      </div>
                    )}
                  </Button>
                </form>
                </Form>
              </TabsContent>
            )}
          </Tabs>

          {/* Development Admin User Creation */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground text-center mb-3">
              Development Mode
            </p>
            <Button
              variant="outline"
              onClick={handleCreateAdminUser}
              disabled={loading}
              className="w-full text-xs"
            >
              Create Admin User (admin@bloom.com)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
