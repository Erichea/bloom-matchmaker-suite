import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { createAdminUser } from "@/utils/createAdminUser";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Heart, UserPlus, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
  const [hasValidAccessCode, setHasValidAccessCode] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // Check if coming from "I already have an account" link
  const isSignInOnly = searchParams.get('mode') === 'signin';

  // Validate access code on mount
  useEffect(() => {
    const validateStoredAccessCode = async () => {
      const storedCode = sessionStorage.getItem('validAccessCode');

      if (!storedCode) {
        setHasValidAccessCode(false);
        return;
      }

      // Verify the code is still valid server-side
      try {
        const { data: validationResult, error } = await supabase.rpc("validate_access_code" as any, {
          p_code: storedCode,
        });

        const codeData = Array.isArray(validationResult) ? validationResult[0] : (validationResult as any);

        // Check if code is valid, not used, and not expired
        const isValid =
          !error &&
          codeData &&
          !(codeData as any).is_used &&
          (!(codeData as any).expires_at || new Date((codeData as any).expires_at) >= new Date());

        if (!isValid) {
          // Clear invalid code from session storage
          sessionStorage.removeItem('validAccessCode');
          setHasValidAccessCode(false);
        } else {
          setHasValidAccessCode(true);
          setActiveTab("signup");
        }
      } catch (error) {
        console.error("Error validating access code:", error);
        sessionStorage.removeItem('validAccessCode');
        setHasValidAccessCode(false);
      }
    };

    validateStoredAccessCode();
  }, []);

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

      // Check if user session was created (email auto-confirmed)
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // User is authenticated, redirect to onboarding
        toast({
          title: "Welcome to Bloom! 🎉",
          description: "Your account has been created. Let's get started!",
          duration: 4000,
        });

        // Redirect to onboarding flow after a brief delay
        setTimeout(() => {
          navigate("/onboarding");
        }, 1500);
      } else {
        // Email confirmation required
        setShowEmailConfirmationMessage(true);
        setActiveTab("signin");
        toast({
          title: "Check your email",
          description: "We've sent you a verification link. Please verify your email to continue.",
          duration: 6000,
        });
      }
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
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      
      {/* Simple gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-surface to-background" />

      <header className="relative z-10 flex items-center justify-between px-6 pb-6 pt-8 md:px-10">
        <Link to="/" className="flex items-center gap-3 text-foreground transition hover:opacity-70">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-sm font-semibold uppercase tracking-[0.3em]">
            B
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.45em]">
            Bloom
          </span>
        </Link>
        <Link
          to="/client"
          className="hidden rounded-full border border-border bg-transparent px-5 py-2.5 text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground transition hover:border-border-hover hover:text-foreground md:block"
        >
          Invitation access
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 items-center px-6 pb-16 md:px-10">
        <motion.div
          className="mx-auto flex w-full max-w-3xl flex-col items-center gap-10 text-center md:items-start md:text-left"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <div className="flex flex-col gap-5">
            <span className="self-center text-[0.65rem] uppercase tracking-[0.35em] text-muted-foreground md:self-start">
              Private members
            </span>
            <h1 className="font-display text-4xl font-light leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Sign in or finish your invitation.
            </h1>
            {!isSignInOnly && !hasValidAccessCode && (
              <div className="flex flex-col gap-2 text-[0.65rem] uppercase tracking-[0.25em] text-muted-foreground">
                <Link
                  to="/client"
                  className="inline-flex items-center justify-center gap-3 self-center rounded-full border border-border bg-secondary px-6 py-2 transition hover:border-border-hover hover:bg-muted md:self-start"
                >
                  <span className="h-px w-6 bg-border" /> Validate access code first
                </Link>
              </div>
            )}
          </div>

          <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          >
            <div className="rounded-3xl border border-border bg-card p-6 shadow-lg sm:p-8">
              <div className="mb-6 space-y-2 text-center md:text-left">
                <span className="text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground">Bloom members</span>
                <h2 className="font-serif text-2xl font-light text-foreground">{activeTab === "signup" ? "Create your account" : "Sign in"}</h2>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {hasValidAccessCode ? "Invitation required" : "Members only"}
                </p>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
                {hasValidAccessCode && !isSignInOnly ? (
                  <TabsList className="flex h-auto w-full items-stretch rounded-2xl bg-secondary p-2 text-[0.65rem] uppercase tracking-[0.25em] text-muted-foreground">
                    <TabsTrigger
                      value="signin"
                      className="flex-1 justify-center rounded-xl px-4 py-2 transition data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                    >
                      Sign In
                    </TabsTrigger>
                    <TabsTrigger
                      value="signup"
                      className="flex-1 justify-center rounded-xl px-4 py-2 transition data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                    >
                      Sign Up
                    </TabsTrigger>
                  </TabsList>
                ) : (
                  <div className="rounded-2xl border border-border bg-secondary px-5 py-3 text-center text-[0.65rem] uppercase tracking-[0.25em] text-muted-foreground">
                    Sign In
                  </div>
                )}

                <TabsContent value="signin" className="space-y-4">
                  {showEmailConfirmationMessage && (
                    <div className="rounded-2xl border border-border bg-secondary p-4 text-center text-xs text-foreground">
                      <div className="flex items-center justify-center gap-2 text-sm text-foreground">
                        <Heart className="h-4 w-4 text-accent" />
                        Check your email for confirmation, then sign in below.
                      </div>
                      <p className="mt-2 text-muted-foreground">Didn&apos;t receive an email? Peek at spam or contact support.</p>
                    </div>
                  )}
                  {!hasValidAccessCode && !showEmailConfirmationMessage && !isSignInOnly && (
                    <div className="rounded-2xl border border-border bg-secondary p-4 text-center text-xs text-muted-foreground">
                      Members sign in to continue your introductions.
                    </div>
                  )}
                  <Form {...signInForm}>
                    <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4 text-left">
                      <FormField
                        control={signInForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground">Email</FormLabel>
                            <FormControl>
                              <Input placeholder="your@email.com" className="bg-input text-foreground" {...field} />
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
                            <FormLabel className="text-foreground">Password</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="••••••••"
                                className="bg-input text-foreground"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full rounded-2xl bg-primary px-8 py-3 text-sm font-medium uppercase tracking-[0.25em] text-primary-foreground shadow-sm transition-all duration-300 hover:bg-primary-hover hover:shadow-md active:scale-[0.98]" disabled={loading}>
                        {loading ? (
                          <div className="flex items-center">
                            <div className="loading-spinner mr-2" />
                            Signing in...
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <LogIn className="mr-2 h-4 w-4" />
                            Sign In
                          </div>
                        )}
                      </Button>
                    </form>
                  </Form>
                  {!isSignInOnly && (
                    <div className="text-center text-xs text-muted-foreground">
                      Have an invitation but no account yet? Switch to sign up once your code is verified.
                    </div>
                  )}
                </TabsContent>

                {hasValidAccessCode && !isSignInOnly && (
                  <TabsContent value="signup" className="space-y-4">
                    <Form {...signUpForm}>
                      <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4 text-left">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <FormField
                            control={signUpForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-foreground">First Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="First name" className="bg-input text-foreground" {...field} />
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
                                <FormLabel className="text-foreground">Last Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Last name" className="bg-input text-foreground" {...field} />
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
                              <FormLabel className="text-foreground">Email</FormLabel>
                              <FormControl>
                                <Input placeholder="your@email.com" className="bg-input text-foreground" {...field} />
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
                              <FormLabel className="text-foreground">Password</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="Create a password"
                                  className="bg-input text-foreground"
                                  {...field}
                                />
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
                              <FormLabel className="text-foreground">Confirm Password</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="Repeat password"
                                  className="bg-input text-foreground"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="w-full rounded-2xl bg-primary px-8 py-3 text-sm font-medium uppercase tracking-[0.25em] text-primary-foreground shadow-sm transition-all duration-300 hover:bg-primary-hover hover:shadow-md active:scale-[0.98]" disabled={loading}>
                          {loading ? (
                            <div className="flex items-center">
                              <div className="loading-spinner mr-2" />
                              Creating account...
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <UserPlus className="mr-2 h-4 w-4" />
                              Create Account
                            </div>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                )}
              </Tabs>

            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default AuthPage;
