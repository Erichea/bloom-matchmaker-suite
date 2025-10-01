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

  const currentYear = new Date().getFullYear();

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

      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(29,32,31,0.92)_0%,rgba(29,32,31,0.78)_40%,rgba(29,32,31,0.6)_100%)]" />
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
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 text-sm font-semibold uppercase tracking-[0.3em]">
            B
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.45em] text-white/70">
            Bloom Matchmaker Suite
          </span>
        </div>
        <span className="text-[0.65rem] uppercase tracking-[0.5em] text-white/50">Concierge access</span>
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
            Step into your curated matchmaking studio.
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
            <Link to="/auth" className="w-full sm:w-auto">
              <button className="w-full rounded-full border border-white/30 bg-white/10 px-10 py-3 text-sm font-medium uppercase tracking-[0.3em] text-white transition hover:border-white/45 hover:bg-white/15">
                I already have an account
              </button>
            </Link>
          </motion.div>

          <motion.div
            className="flex flex-col items-center gap-2 text-[0.65rem] uppercase tracking-[0.45em] text-white/50 md:flex-row md:items-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <span>Tailored onboarding</span>
            <span className="hidden h-[1px] w-8 bg-white/30 md:block" />
            <span>Real matchmakers</span>
            <span className="hidden h-[1px] w-8 bg-white/30 md:block" />
            <span>By invitation</span>
          </motion.div>
        </motion.div>
      </main>

      <footer className="relative z-10 flex justify-center px-6 pb-8 text-[0.6rem] uppercase tracking-[0.4em] text-white/40 md:px-10">
        © {currentYear} Bloom Matchmaker Suite
      </footer>
    </div>
  );
};

export default Index;
