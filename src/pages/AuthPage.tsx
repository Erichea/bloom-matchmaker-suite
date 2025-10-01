import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { createAdminUser } from "@/utils/createAdminUser";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Sparkles, Heart, UserPlus, LogIn } from "lucide-react";
import { PremiumButton } from "@/components/experience/PremiumButton";

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
  const currentYear = new Date().getFullYear();

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
        title: "Welcome to BLOOM! 🎉",
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
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[hsl(var(--brand-secondary))] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(29,32,31,0.92)_0%,rgba(29,32,31,0.78)_40%,rgba(29,32,31,0.6)_100%)]" />
      <div className="absolute inset-0 backdrop-blur-sm" />

      <motion.div
        className="pointer-events-none absolute -left-32 top-1/4 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(223,146,142,0.25)_0%,rgba(223,146,142,0)_70%)]"
        animate={{ y: [-15, 10, -15], x: [0, 20, 0] }}
        transition={{ duration: 16, repeat: Infinity, repeatType: "mirror" }}
      />
      <motion.div
        className="pointer-events-none absolute -bottom-24 right-[-8rem] h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,rgba(223,146,142,0.2)_0%,rgba(223,146,142,0)_70%)]"
        animate={{ y: [10, -20, 10], x: [0, -20, 0] }}
        transition={{ duration: 20, repeat: Infinity, repeatType: "mirror" }}
      />

      <header className="relative z-10 flex items-center px-6 pb-6 pt-8 md:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 text-sm font-semibold uppercase tracking-[0.3em]">
            B
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.45em] text-white">Bloom</span>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center px-6 pb-16 pt-6 md:px-10">
        <motion.div
          className="mx-auto w-full max-w-lg"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Card className="w-full border-white/15 bg-white/5 text-white shadow-[0_28px_96px_-48px_rgba(18,18,18,0.65)] backdrop-blur-lg">
            <CardHeader className="space-y-4 text-center">
              <div className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-4 py-1 text-[0.65rem] uppercase tracking-[0.3em] text-white/70">
                <Sparkles className="h-3.5 w-3.5" /> Private portal
              </div>
              <CardTitle className="font-display text-3xl text-white">Bloom access</CardTitle>
              <CardDescription className="text-sm text-white/70">
                Sign in to continue or activate your invitation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                {hasValidAccessCode ? (
                  <TabsList className="grid w-full grid-cols-2 gap-2 rounded-full border border-white/15 bg-white/10 p-1">
                    <TabsTrigger
                      value="signin"
                      className="rounded-full px-4 py-2 text-[0.7rem] uppercase tracking-[0.3em] text-white/70 transition data-[state=active]:bg-white data-[state=active]:text-[hsl(var(--brand-secondary))]"
                    >
                      Sign In
                    </TabsTrigger>
                    <TabsTrigger
                      value="signup"
                      className="rounded-full px-4 py-2 text-[0.7rem] uppercase tracking-[0.3em] text-white/70 transition data-[state=active]:bg-white data-[state=active]:text-[hsl(var(--brand-secondary))]"
                    >
                      Sign Up
                    </TabsTrigger>
                  </TabsList>
                ) : (
                  <div className="mb-6 text-center text-[0.65rem] uppercase tracking-[0.4em] text-white/60">
                    Sign in to continue
                  </div>
                )}

                <TabsContent value="signin" className="space-y-4">
                  {showEmailConfirmationMessage && (
                    <div className="animate-fade-in rounded-2xl border border-white/15 bg-white/10 p-4">
                      <div className="mb-2 flex items-center justify-center gap-2">
                        <Heart className="h-4 w-4 text-white/70" />
                        <p className="text-sm text-white/80">Check your email for confirmation, then sign in below.</p>
                      </div>
                      <p className="text-xs text-center text-white/60">
                        Didn't receive an email? Check spam or reach out to your matchmaker.
                      </p>
                    </div>
                  )}
                  {!hasValidAccessCode && !showEmailConfirmationMessage && (
                    <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
                      <div className="space-y-2 text-center">
                        <p className="text-sm text-white/80">Welcome back to Bloom.</p>
                        <p className="text-xs text-white/60">
                          Need an account? Request an invitation from your matchmaker.
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
                            <FormLabel className="text-xs uppercase tracking-[0.3em] text-white/60">Email</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="name@bloom.com"
                                className="h-12 rounded-full border border-white/15 bg-white/10 px-6 text-sm tracking-[0.15em] text-white placeholder:text-white/40 focus:border-white/40 focus:ring-white/30"
                                {...field}
                              />
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
                            <FormLabel className="text-xs uppercase tracking-[0.3em] text-white/60">Password</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="••••••••"
                                className="h-12 rounded-full border border-white/15 bg-white/10 px-6 text-sm tracking-[0.15em] text-white placeholder:text-white/40 focus:border-white/40 focus:ring-white/30"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <PremiumButton type="submit" className="group w-full justify-center uppercase tracking-[0.3em]" disabled={loading}>
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            Signing in
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <LogIn className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            Sign In
                          </div>
                        )}
                      </PremiumButton>
                    </form>
                  </Form>
                </TabsContent>

                {hasValidAccessCode && (
                  <TabsContent value="signup" className="space-y-4">
                    <div className="animate-fade-in rounded-2xl border border-white/15 bg-white/10 p-4">
                      <div className="mb-2 flex items-center justify-center gap-2">
                        <Heart className="h-4 w-4 text-white/70" />
                        <p className="text-sm text-white/80">Welcome—create your credentials to begin.</p>
                      </div>
                      <p className="text-xs text-center text-white/60">
                        Already have an account?
                        <button
                          type="button"
                          onClick={() => setActiveTab("signin")}
                          className="ml-2 text-white underline-offset-4 transition hover:underline"
                        >
                          Sign in here
                        </button>
                      </p>
                    </div>
                    <Form {...signUpForm}>
                      <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <FormField
                            control={signUpForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs uppercase tracking-[0.3em] text-white/60">First name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="First name"
                                    className="h-12 rounded-full border border-white/15 bg-white/10 px-6 text-sm tracking-[0.15em] text-white placeholder:text-white/40 focus:border-white/40 focus:ring-white/30"
                                    {...field}
                                  />
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
                                <FormLabel className="text-xs uppercase tracking-[0.3em] text-white/60">Last name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Last name"
                                    className="h-12 rounded-full border border-white/15 bg-white/10 px-6 text-sm tracking-[0.15em] text-white placeholder:text-white/40 focus:border-white/40 focus:ring-white/30"
                                    {...field}
                                  />
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
                              <FormLabel className="text-xs uppercase tracking-[0.3em] text-white/60">Email</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="name@bloom.com"
                                  className="h-12 rounded-full border border-white/15 bg-white/10 px-6 text-sm tracking-[0.15em] text-white placeholder:text-white/40 focus:border-white/40 focus:ring-white/30"
                                  {...field}
                                />
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
                              <FormLabel className="text-xs uppercase tracking-[0.3em] text-white/60">Password</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="Create password"
                                  className="h-12 rounded-full border border-white/15 bg-white/10 px-6 text-sm tracking-[0.15em] text-white placeholder:text-white/40 focus:border-white/40 focus:ring-white/30"
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
                              <FormLabel className="text-xs uppercase tracking-[0.3em] text-white/60">Confirm</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="Re-enter password"
                                  className="h-12 rounded-full border border-white/15 bg-white/10 px-6 text-sm tracking-[0.15em] text-white placeholder:text-white/40 focus:border-white/40 focus:ring-white/30"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <PremiumButton type="submit" className="group w-full justify-center uppercase tracking-[0.3em]" disabled={loading}>
                          {loading ? (
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                              Creating account
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <UserPlus className="h-4 w-4 transition-transform group-hover:scale-110" />
                              Create Account
                            </div>
                          )}
                        </PremiumButton>
                      </form>
                    </Form>
                  </TabsContent>
                )}
              </Tabs>

              <div className="border-t border-white/10 pt-6">
                <p className="mb-3 text-center text-[0.65rem] uppercase tracking-[0.3em] text-white/40">Development mode</p>
                <Button
                  variant="outline"
                  onClick={handleCreateAdminUser}
                  disabled={loading}
                  className="w-full rounded-full border border-white/20 bg-white/5 px-6 py-3 text-xs uppercase tracking-[0.3em] text-white/70 transition hover:border-white/40 hover:bg-white/10"
                >
                  Create admin user (admin@bloom.com)
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <footer className="relative z-10 flex justify-center px-6 pb-8 text-[0.6rem] uppercase tracking-[0.4em] text-white/40 md:px-10">
        © {currentYear} Bloom
      </footer>
    </div>
  );
};

export default AuthPage;
