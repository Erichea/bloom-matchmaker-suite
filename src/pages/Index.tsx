import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { PremiumButton } from "@/components/experience/PremiumButton";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is authenticated and auth is not loading, redirect to dashboard
    if (!loading && user) {
      console.log("User is authenticated, redirecting to dashboard");
      navigate("/client/dashboard");
    }
  }, [user, loading, navigate]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--background))]">
        <motion.div
          className="h-24 w-24 rounded-full border-[3px] border-[hsl(var(--brand-secondary))]/20 border-t-[hsl(var(--brand-primary))]"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
        />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[hsl(var(--background))] text-[hsl(var(--brand-secondary))]">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(190,76,139,0.16),_transparent_55%)]" />
      <div className="absolute inset-y-0 right-0 -z-10 hidden w-1/2 bg-[hsl(var(--surface))] sm:block" />

      <motion.div
        className="mx-auto flex max-w-lg flex-col items-center gap-10 px-6 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="space-y-4">
          <span className="inline-flex items-center justify-center rounded-full border border-[hsl(var(--brand-secondary))]/20 px-6 py-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Bloom Matchmaker Suite
          </span>
          <h1 className="font-display text-4xl tracking-tight text-[hsl(var(--brand-secondary))] sm:text-5xl">
            Welcome.
          </h1>
        </div>

        <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
          <Link to="/client" className="w-full sm:w-auto">
            <PremiumButton className="w-full sm:w-auto">Get started</PremiumButton>
          </Link>
          <Link to="/auth" className="w-full sm:w-auto">
            <button className="w-full rounded-full border border-[hsl(var(--brand-secondary))]/20 bg-[hsl(var(--surface))] px-6 py-3 text-sm font-medium text-[hsl(var(--brand-secondary))] transition hover:border-[hsl(var(--brand-secondary))]/40">
              I already have an account
            </button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Index;
