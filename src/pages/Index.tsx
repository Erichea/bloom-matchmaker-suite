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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black text-[hsl(var(--brand-secondary))]">
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

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(17,17,17,0.35),_rgba(17,17,17,0.85))]" />
      <div className="absolute inset-0 backdrop-blur-md" />

      <motion.div
        className="relative z-10 mx-auto flex w-full max-w-lg flex-col items-center gap-8 rounded-[28px] border border-white/10 bg-white/5 p-10 text-center shadow-[0_40px_120px_-60px_rgba(10,10,10,0.9)] backdrop-blur-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="space-y-3">
          <span className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-2 text-xs uppercase tracking-[0.3em] text-white/70">
            Bloom Matchmaker Suite
          </span>
          <h1 className="font-display text-4xl tracking-tight text-white sm:text-5xl">
            Begin your experience
          </h1>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <Link to="/client" className="w-full">
            <PremiumButton className="w-full justify-center text-base">Get started</PremiumButton>
          </Link>
          <Link to="/auth" className="w-full">
            <button className="w-full rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-medium text-white transition hover:border-white/40 hover:bg-white/15">
              I already have an account
            </button>
          </Link>
        </div>

        <p className="text-xs uppercase tracking-[0.3em] text-white/60">Private access for members only</p>
      </motion.div>
    </div>
  );
};

export default Index;
