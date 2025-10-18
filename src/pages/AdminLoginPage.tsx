import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Shield, Lock, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignInForm = z.infer<typeof signInSchema>;

const AdminLoginPage = () => {
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();

  const from = location.state?.from?.pathname || "/admin";

  const signInForm = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSignIn = async (data: SignInForm) => {
    setLoading(true);
    const { error } = await signIn(data.email, data.password);

    if (!error) {
      // Check if user is admin
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (!roleError && roleData?.role === 'admin') {
          toast({
            title: "Welcome Admin! 🔐",
            description: "Successfully signed in to admin dashboard.",
          });
          navigate(from, { replace: true });
        } else {
          toast({
            title: "Access Denied",
            description: "You do not have admin privileges.",
            variant: "destructive",
          });
          await supabase.auth.signOut();
        }
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 backdrop-blur">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-slate-700/50 p-4">
              <Shield className="h-8 w-8 text-blue-400" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-white">{t('admin.adminPortal')}</CardTitle>
            <CardDescription className="text-slate-400">
              {t('admin.signInWithAdminCredentials')}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...signInForm}>
            <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
              <FormField
                control={signInForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200">{t('auth.email')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="admin@bloom.com"
                        className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
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
                    <FormLabel className="text-slate-200">{t('auth.password')}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t('auth.passwordPlaceholder')}
                        className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white group"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    {t('common.loading')}
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Lock className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                    {t('admin.signInToAdminPortal')}
                  </div>
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <div className="text-center space-y-2">
              <p className="text-xs text-slate-400">
                Not an administrator?
              </p>
              <Button
                variant="ghost"
                onClick={() => navigate("/client")}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Go to Client Portal
              </Button>
            </div>
          </div>

          {/* Development hint */}
          <div className="mt-4 p-3 bg-slate-900/50 border border-slate-700 rounded-lg">
            <p className="text-xs text-slate-400 text-center">
              <span className="font-semibold text-slate-300">{t('admin.development')}</span> {t('admin.defaultAdminCredentials')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLoginPage;