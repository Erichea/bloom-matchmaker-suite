import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { PremiumButton } from "@/components/experience/PremiumButton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, ClipboardPaste, LogIn } from "lucide-react";

const ClientWelcome = () => {
  const [accessCode, setAccessCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        toast({
          title: "Clipboard is empty",
          description: "Copy your invitation code first, then use the shortcut.",
        });
        return;
      }

      setAccessCode(text.trim().toUpperCase());
    } catch (error) {
      console.error("Clipboard access denied", error);
      toast({
        title: "Clipboard access needed",
        description: "Allow clipboard permissions to paste your invitation code automatically.",
        variant: "destructive",
      });
    }
  };

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
        <Link to="/" className="flex items-center gap-3 text-white transition hover:opacity-80">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 text-sm font-semibold uppercase tracking-[0.3em]">
            B
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.45em]">
            Bloom
          </span>
        </Link>
        <Link
          to="/auth?mode=signin"
          className="hidden items-center gap-2 rounded-full border border-white/20 px-5 py-2 text-[0.65rem] uppercase tracking-[0.35em] text-white/70 transition hover:border-white/35 hover:text-white md:inline-flex"
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
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 text-[0.65rem] uppercase tracking-[0.28em] text-white/80">
            <Sparkles className="h-4 w-4" /> Invitation only
          </span>
          <h1 className="font-display text-4xl leading-[1.05] tracking-tight text-white sm:text-5xl">
            Enter your Bloom invitation code.
          </h1>
          <p className="max-w-xl text-sm leading-7 text-white/75 md:text-base">
            The code keeps Bloom intentionally intimate. Paste or type the invitation your matchmaker sent to unlock the
            private onboarding experience.
          </p>

          <motion.form
            onSubmit={handleSubmit}
            className="w-full"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
          >
            <div className="space-y-6 rounded-[26px] border border-white/15 bg-white/[0.08] p-6 shadow-[0_32px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-8">
              <div className="space-y-2 text-left">
                <span className="text-[0.65rem] uppercase tracking-[0.25em] text-white/65">Invitation code</span>
                <Input
                  id="accessCode"
                  value={accessCode}
                  onChange={(event) => setAccessCode(event.target.value.toUpperCase())}
                  placeholder="BLOOM-2024"
                  className="h-14 rounded-full border-white/20 bg-white/90 text-center text-base uppercase tracking-[0.5em] text-[hsl(var(--brand-secondary))]"
                  required
                />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <PremiumButton
                  type="submit"
                  disabled={isValidating || !accessCode.trim()}
                  className="w-full justify-center sm:flex-1"
                >
                  {isValidating ? "Verifying" : "Continue"}
                </PremiumButton>
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="group flex w-full items-center justify-center gap-2 rounded-full border border-white/25 px-6 py-3 text-[0.65rem] uppercase tracking-[0.35em] text-white/70 transition hover:border-white/40 hover:text-white sm:w-auto"
                >
                  <ClipboardPaste className="h-4 w-4 transition-transform group-hover:scale-110" /> Paste code
                </button>
              </div>
              <p className="text-center text-[0.65rem] uppercase tracking-[0.3em] text-white/70">
                Shortcut ready — paste from your clipboard or type slowly. Verification takes only a moment.
              </p>
            </div>
          </motion.form>

          <div className="flex flex-col gap-2 text-[0.65rem] uppercase tracking-[0.25em] text-white/70">
            <span className="inline-flex items-center gap-3 self-center md:self-start">
              <span className="h-px w-6 bg-white/40" /> Already a member?
              <Link to="/auth?mode=signin" className="text-white transition hover:opacity-80">Sign in</Link>
            </span>
            <span className="inline-flex items-center gap-3 self-center md:self-start">
              <span className="h-px w-6 bg-white/40" /> Need help? Contact your matchmaker concierge.
            </span>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default ClientWelcome;
