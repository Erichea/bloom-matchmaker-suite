import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      console.log('Initializing auth...');
      try {
        // Get initial session first
        const { data: { session }, error } = await supabase.auth.getSession();

        console.log('Initial session check:', {
          session: !!session,
          user: session?.user?.id,
          error: error?.message
        });

        if (error) {
          console.error('Error getting initial session:', error);
        }

        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
          console.log('Auth state initialized:', {
            hasSession: !!session,
            hasUser: !!session?.user,
            userId: session?.user?.id
          });
          // Set loading to false immediately after setting the initial state
          console.log('Setting auth loading to false');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Initialize auth first
    initializeAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, !!session);

        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);


        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      console.log('Attempting signup with:', { email, firstName, lastName });

      // For development: temporarily disable email confirmation
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined, // We'll use OTP instead of email links
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      });

      console.log('Signup response:', { data, error });

      if (error) {
        console.error('Signup error details:', error);
        toast({
          title: "Sign Up Error",
          description: error.message || "Failed to create account. Please try again.",
          variant: "destructive",
        });
      } else {
        console.log('Signup successful!', data);
        console.log('User details:', {
          id: data.user?.id,
          email: data.user?.email,
          email_confirmed_at: data.user?.email_confirmed_at,
          confirmation_sent_at: data.user?.confirmation_sent_at,
          session: !!data.session
        });

        if (data.user) {
          console.log('Creating user role for:', data.user.id);
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: data.user.id,
              role: 'client' // Default role is client
            });

          if (roleError) {
            console.error('Error creating user role:', roleError);
            // Optionally, handle this error more gracefully
          } else {
            console.log('User role created successfully.');
          }

          // Update local auth state immediately if session was created
          if (data.session) {
            console.log('Session created during signup, updating auth state');
            setSession(data.session);
            setUser(data.user);
          }
        }

        // Don't show toast here - let the calling component handle it
        // This prevents duplicate toasts
      }

      console.log('[useAuth] Returning from signUp with error:', error, 'and session:', !!data?.session);
      return { error, session: data?.session, user: data?.user };
    } catch (error: any) {
      toast({
        title: "Sign Up Error",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log("Attempting to sign in with:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("Sign in response:", { data, error });

      if (error) {
        console.error("Sign in error:", error);
        toast({
          title: "Sign In Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        console.log("Sign in successful:", data);
        toast({
          title: "Success",
          description: "Signed in successfully!",
        });
      }

      return { error };
    } catch (error: any) {
      console.error("Sign in exception:", error);
      toast({
        title: "Sign In Error",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Sign Out Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Sign Out Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};