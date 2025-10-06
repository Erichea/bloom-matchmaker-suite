import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, LogIn } from "lucide-react";

const ClientWelcome = () => {
  const [accessCode, setAccessCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsValidating(true);

    try {
      const normalizedCode = accessCode.trim().toUpperCase();
      const { data: validationResult, error } = await supabase.rpc("validate_access_code" as any, {
        p_code: normalizedCode,
      });

      const codeData = Array.isArray(validationResult) ? validationResult[0] : (validationResult as any);

      if (error || !codeData) {
        toast({
          title: "Invalid access code",
          description: error?.message || "Please verify the invitation you received.",
          variant: "destructive",
        });
        return;
      }

      if ((codeData as any).is_used) {
        toast({
          title: "Code already used",
          description: "This invitation has already been redeemed.",
          variant: "destructive",
        });
        return;
      }

      if ((codeData as any).expires_at && new Date((codeData as any).expires_at) < new Date()) {
        toast({
          title: "Code expired",
          description: "Please contact your matchmaker for a fresh invitation.",
          variant: "destructive",
        });
        return;
      }

      sessionStorage.setItem("validAccessCode", normalizedCode);
      toast({
        title: "Welcome to Bloom",
        description: "Let’s create your membership profile.",
      });
      navigate("/auth");
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
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
          to="/auth?mode=signin"
          className="hidden items-center gap-2 rounded-full border border-border bg-transparent px-5 py-2.5 text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground transition hover:border-border-hover hover:text-foreground md:inline-flex"
        >
          <LogIn className="h-3.5 w-3.5" /> Sign in
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 items-center px-6 pb-16 md:px-10">
        <motion.div
          className="mx-auto flex w-full max-w-2xl flex-col items-center gap-10 text-center md:items-start md:text-left"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2 text-[0.65rem] uppercase tracking-[0.28em] text-muted-foreground shadow-sm">
            <Sparkles className="h-4 w-4" /> Invitation only
          </span>
          <h1 className="font-display text-4xl font-light leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Enter your Bloom invitation code.
          </h1>

          <motion.form
            onSubmit={handleSubmit}
            className="w-full"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
          >
            <div className="space-y-6 rounded-3xl border border-border bg-card p-6 shadow-lg sm:p-8">
              <div className="space-y-3 text-left">
                <span className="text-[0.65rem] uppercase tracking-[0.25em] text-muted-foreground">Invitation code</span>
                <Input
                  id="accessCode"
                  value={accessCode}
                  onChange={(event) => setAccessCode(event.target.value.toUpperCase())}
                  placeholder="BLOOM-2024"
                  className="h-14 rounded-2xl border-border bg-input text-center text-base uppercase tracking-[0.4em] text-foreground"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={isValidating || !accessCode.trim()}
                className="w-full rounded-2xl bg-primary px-8 py-3.5 text-sm font-medium uppercase tracking-[0.25em] text-primary-foreground shadow-sm transition-all duration-300 hover:bg-primary-hover hover:shadow-md active:scale-[0.98]"
              >
                {isValidating ? "Verifying..." : "Continue"}
              </Button>
            </div>
          </motion.form>

          <div className="flex flex-col gap-2 text-[0.65rem] uppercase tracking-[0.25em] text-muted-foreground">
            <span className="inline-flex items-center gap-3 self-center md:self-start">
              <span className="h-px w-6 bg-border" /> Already a member?
              <Link to="/auth?mode=signin" className="text-foreground transition hover:text-accent">Sign in</Link>
            </span>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default ClientWelcome;
