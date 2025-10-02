import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { PremiumButton } from "@/components/experience/PremiumButton";

// Simple CSS animation instead of framer-motion for better performance
const floatAnimation = `
  @keyframes float {
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(15px, -10px); }
  }
`;

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

  const currentYear = new Date().getFullYear();

  return (
    <>
      <style>{floatAnimation}</style>
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-[hsl(var(--brand-secondary))] text-white">
      {/* Static gradient background - much faster than video */}
      <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(var(--brand-secondary))_0%,#2a3c3a_50%,#1f2b2a_100%)]" />

      {/* Simplified gradient overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(29,32,31,0.85)_0%,rgba(29,32,31,0.65)_40%,rgba(29,32,31,0.45)_100%)]" />

      {/* Reduced animations - only one blob with simpler motion */}
      <div
        className="pointer-events-none absolute -left-24 top-1/3 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(223,146,142,0.25)_0%,rgba(223,146,142,0)_70%)] opacity-60"
        style={{
          animation: 'float 20s ease-in-out infinite',
        }}
      />

      <header className="relative z-10 flex items-center px-6 pb-6 pt-8 md:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 text-sm font-semibold uppercase tracking-[0.3em]">
            B
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.45em] text-white">
            Bloom
          </span>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center px-6 pb-16 md:px-10">
        <motion.div
          className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8 text-center md:items-start md:text-left"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <motion.span
            className="text-[0.7rem] uppercase tracking-[0.5em] text-white/60"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Private introductions. Human-first.
          </motion.span>
          <motion.h1
            className="font-display text-4xl leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Bloom.
          </motion.h1>

          <motion.div
            className="flex w-full flex-col items-center gap-3 sm:flex-row md:items-start"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Link to="/client" className="w-full sm:w-auto">
              <PremiumButton className="w-full justify-center px-10 py-3 text-base uppercase tracking-[0.3em]">
                Get started
              </PremiumButton>
            </Link>
            <Link to="/auth?mode=signin" className="w-full sm:w-auto">
              <button className="w-full rounded-full border border-white/30 bg-white/10 px-10 py-3 text-sm font-medium uppercase tracking-[0.3em] text-white transition hover:border-white/45 hover:bg-white/15">
                I already have an account
              </button>
            </Link>
          </motion.div>

        </motion.div>
      </main>

      <footer className="relative z-10 flex justify-center px-6 pb-8 text-[0.6rem] uppercase tracking-[0.4em] text-white/40 md:px-10">
        © {currentYear} Bloom
      </footer>
      </div>
    </>
  );
};

export default Index;
