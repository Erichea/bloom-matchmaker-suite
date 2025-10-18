import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { PremiumButton } from "@/components/experience/PremiumButton";
import { Logo } from "@/components/Logo";

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
  const { t } = useTranslation();

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
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark">


      <header className="relative z-10 flex items-center px-6 pb-6 pt-8 md:px-10">
        <Logo size="md" />
      </header>

      <main className="relative z-10 flex flex-1 items-center px-6 pb-16 md:px-10">
        <motion.div
          className="mx-auto flex w-full max-w-2xl flex-col items-center gap-10 text-center md:items-start md:text-left"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <motion.span
            className="text-[0.65rem] uppercase tracking-[0.4em] text-muted-foreground"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {t('landing.privateIntroductions')}
          </motion.span>
          <motion.h1
            className="font-display text-5xl font-light leading-[1.05] tracking-tight text-foreground sm:text-6xl md:text-7xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {t('landing.bloom')}
          </motion.h1>

          <motion.div
            className="flex w-full flex-col items-center gap-4 sm:flex-row md:items-start"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Link to="/client" className="w-full sm:w-auto">
              <button className="w-full rounded-full bg-primary px-10 py-3.5 text-sm font-medium uppercase tracking-[0.25em] text-primary-foreground shadow-sm transition-all duration-300 hover:bg-primary-hover hover:shadow-md active:scale-[0.98] sm:w-auto">
                {t('landing.getStarted')}
              </button>
            </Link>
            <Link to="/auth?mode=signin" className="w-full sm:w-auto">
              <button className="w-full rounded-full border border-border bg-transparent px-10 py-3.5 text-sm font-medium uppercase tracking-[0.25em] text-foreground transition-all duration-300 hover:border-border-hover hover:bg-secondary active:scale-[0.98] sm:w-auto">
                {t('landing.alreadyHaveAccount')}
              </button>
            </Link>
          </motion.div>

        </motion.div>
      </main>

      <footer className="relative z-10 flex justify-center px-6 pb-8 text-[0.6rem] uppercase tracking-[0.4em] text-muted-foreground md:px-10">
        {t('landing.copyright', { year: currentYear })}
      </footer>
      </div>
    </>
  );
};

export default Index;
