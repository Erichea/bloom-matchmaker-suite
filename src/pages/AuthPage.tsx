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

      toast({
        title: "Welcome to Bloom! 🎉",
        description: "Your account has been created. Let's get started!",
        duration: 4000,
      });

      // Redirect to onboarding flow after a brief delay
      setTimeout(() => {
        navigate("/onboarding");
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
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[hsl(var(--brand-secondary))] text-white">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        poster="/placeholder.svg"
      >
        <source src="https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(29,32,31,0.92)_0%,rgba(29,32,31,0.78)_40%,rgba(29,32,31,0.65)_100%)]" />
      <div className="absolute inset-0 backdrop-blur-sm" />

      <motion.div
        className="pointer-events-none absolute -left-24 top-1/3 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(223,146,142,0.35)_0%,rgba(223,146,142,0)_70%)]"
        animate={{ y: [-20, 10, -20], x: [0, 15, 0] }}
        transition={{ duration: 14, repeat: Infinity, repeatType: "mirror" }}
      />
      <motion.div
        className="pointer-events-none absolute -bottom-16 right-[-6rem] h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,rgba(223,146,142,0.25)_0%,rgba(223,146,142,0)_70%)]"
        animate={{ y: [10, -15, 10], x: [0, -20, 0] }}
        transition={{ duration: 18, repeat: Infinity, repeatType: "mirror" }}
      />

      <header className="relative z-10 flex items-center justify-between px-6 pb-6 pt-8 md:px-10">
        <Link to="/" className="flex items-center gap-3 text-white transition hover:opacity-80">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 text-sm font-semibold uppercase tracking-[0.3em]">
            B
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.45em]">
            Bloom
          </span>
        </Link>
        <Link
          to="/client"
          className="hidden rounded-full border border-white/20 px-5 py-2 text-[0.65rem] uppercase tracking-[0.35em] text-white/70 transition hover:border-white/35 hover:text-white md:block"
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
            <span className="self-center text-[0.65rem] uppercase tracking-[0.35em] text-white/60 md:self-start">
              Private members
            </span>
            <h1 className="font-display text-4xl leading-[1.05] tracking-tight text-white sm:text-5xl">
              Sign in or finish your invitation.
            </h1>
            {!isSignInOnly && !hasValidAccessCode && (
              <div className="flex flex-col gap-2 text-[0.65rem] uppercase tracking-[0.25em] text-white/70">
                <Link
                  to="/client"
                  className="inline-flex items-center justify-center gap-3 self-center rounded-full border border-white/20 bg-white/5 px-6 py-2 transition hover:border-white/40 hover:text-white md:self-start"
                >
                  <span className="h-px w-6 bg-white/40" /> Validate access code first
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
            <div className="rounded-[28px] border border-white/15 bg-white/[0.08] p-6 shadow-[0_32px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-8">
              <div className="mb-6 space-y-1 text-center md:text-left">
                <span className="text-[0.65rem] uppercase tracking-[0.3em] text-white/60">Bloom members</span>
                <h2 className="text-2xl font-semibold text-white">{activeTab === "signup" ? "Create your account" : "Sign in"}</h2>
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                  {hasValidAccessCode ? "Invitation required" : "Members only"}
                </p>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
                {hasValidAccessCode && !isSignInOnly ? (
                  <TabsList className="flex h-auto w-full items-stretch rounded-2xl bg-white/10 p-2 text-[0.65rem] uppercase tracking-[0.25em] text-white/70">
                    <TabsTrigger
                      value="signin"
                      className="flex-1 justify-center rounded-xl px-4 py-2 transition data-[state=active]:bg-white data-[state=active]:text-[hsl(var(--brand-secondary))] data-[state=active]:shadow-sm"
                    >
                      Sign In
                    </TabsTrigger>
                    <TabsTrigger
                      value="signup"
                      className="flex-1 justify-center rounded-xl px-4 py-2 transition data-[state=active]:bg-white data-[state=active]:text-[hsl(var(--brand-secondary))] data-[state=active]:shadow-sm"
                    >
                      Sign Up
                    </TabsTrigger>
                  </TabsList>
                ) : (
                  <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-center text-[0.65rem] uppercase tracking-[0.25em] text-white/70">
                    Sign In
                  </div>
                )}

                <TabsContent value="signin" className="space-y-4">
                  {showEmailConfirmationMessage && (
                    <div className="rounded-2xl border border-white/20 bg-white/10 p-4 text-center text-xs text-white/80">
                      <div className="flex items-center justify-center gap-2 text-sm text-white">
                        <Heart className="h-4 w-4 text-white" />
                        Check your email for confirmation, then sign in below.
                      </div>
                      <p className="mt-2 text-white/70">Didn&apos;t receive an email? Peek at spam or contact support.</p>
                    </div>
                  )}
                  {!hasValidAccessCode && !showEmailConfirmationMessage && !isSignInOnly && (
                    <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-center text-xs text-white/70">
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
                            <FormLabel className="text-white/80">Email</FormLabel>
                            <FormControl>
                              <Input placeholder="your@email.com" className="bg-white/95 text-[hsl(var(--brand-secondary))]" {...field} />
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
                            <FormLabel className="text-white/80">Password</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="••••••••"
                                className="bg-white/95 text-[hsl(var(--brand-secondary))]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="btn-premium w-full group" disabled={loading}>
                        {loading ? (
                          <div className="flex items-center">
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                            Signing in...
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <LogIn className="mr-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                            Sign In
                          </div>
                        )}
                      </Button>
                    </form>
                  </Form>
                  {!isSignInOnly && (
                    <div className="text-center text-xs text-white/70">
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
                                <FormLabel className="text-white/80">First Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="First name" className="bg-white/95 text-[hsl(var(--brand-secondary))]" {...field} />
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
                                <FormLabel className="text-white/80">Last Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Last name" className="bg-white/95 text-[hsl(var(--brand-secondary))]" {...field} />
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
                              <FormLabel className="text-white/80">Email</FormLabel>
                              <FormControl>
                                <Input placeholder="your@email.com" className="bg-white/95 text-[hsl(var(--brand-secondary))]" {...field} />
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
                              <FormLabel className="text-white/80">Password</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="Create a password"
                                  className="bg-white/95 text-[hsl(var(--brand-secondary))]"
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
                              <FormLabel className="text-white/80">Confirm Password</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="Repeat password"
                                  className="bg-white/95 text-[hsl(var(--brand-secondary))]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="btn-premium w-full group" disabled={loading}>
                          {loading ? (
                            <div className="flex items-center">
                              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                              Creating account...
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <UserPlus className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
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
