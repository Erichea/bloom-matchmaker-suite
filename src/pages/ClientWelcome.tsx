import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PremiumButton } from "@/components/experience/PremiumButton";
import { ProfileCard } from "@/components/experience/ProfileCard";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Sparkles, Users } from "lucide-react";

const ClientWelcome = () => {
  const [accessCode, setAccessCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsValidating(true);

    try {
      const normalizedCode = accessCode.trim().toUpperCase();
      const { data: validationResult, error } = await supabase.rpc("validate_access_code", {
        p_code: normalizedCode,
      });

      const codeData = Array.isArray(validationResult) ? validationResult[0] : null;

      if (error || !codeData) {
        toast({
          title: "Invalid access code",
          description: error?.message || "Please verify the invitation you received.",
          variant: "destructive",
        });
        return;
      }

      if (codeData.is_used) {
        toast({
          title: "Code already used",
          description: "This invitation has already been redeemed.",
          variant: "destructive",
        });
        return;
      }

      if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
        toast({
          title: "Code expired",
          description: "Please contact your matchmaker for a fresh invitation.",
          variant: "destructive",
        });
        return;
      }

      sessionStorage.setItem("validAccessCode", normalizedCode);
      toast({
        title: "Welcome to BLOOM",
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
        <div className="mx-auto grid w-full max-w-5xl gap-16 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            className="space-y-10"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-1 text-xs uppercase tracking-[0.3em] text-white/70">
                <Sparkles className="h-3 w-3" /> Invitation only
              </span>
              <h1 className="font-display text-4xl leading-tight tracking-tight text-white sm:text-5xl">
                Access Bloom with your code.
              </h1>
              <p className="max-w-lg text-sm leading-7 text-white/70">
                Enter the invitation shared by your matchmaker to open your private onboarding. Every membership remains
                personal, discreet, and guided by a human team.
              </p>
            </div>

            <motion.form
              onSubmit={handleSubmit}
              className="space-y-6 rounded-3xl border border-white/15 bg-white/5 p-8 shadow-[0_28px_96px_-48px_rgba(18,18,18,0.65)] backdrop-blur"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            >
              <div className="space-y-2">
                <Label htmlFor="accessCode" className="text-xs uppercase tracking-[0.3em] text-white/60">
                  Invitation code
                </Label>
                <Input
                  id="accessCode"
                  value={accessCode}
                  onChange={(event) => setAccessCode(event.target.value.toUpperCase())}
                  placeholder="BLOOM-2024"
                  className="h-12 rounded-full border border-white/15 bg-white/10 text-center text-base uppercase tracking-[0.5em] text-white placeholder:text-white/40 focus:border-white/40 focus:ring-white/30"
                  required
                />
              </div>
              <PremiumButton type="submit" disabled={isValidating || !accessCode.trim()} className="w-full justify-center">
                {isValidating ? "Verifying" : "Continue"}
              </PremiumButton>
              <div className="grid grid-cols-1 gap-3 text-[0.7rem] uppercase tracking-[0.3em] text-white/60 sm:grid-cols-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-white/60" /> Verified privacy
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-white/60" /> Curated members
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-white/60" /> Guided intros
                </div>
              </div>
            </motion.form>
          </motion.div>

          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          >
            <ProfileCard
              name="Elise, Matchmaker"
              headline="Personal interviews. Tailored introductions."
              bio="We meet every member individually and guide each step so you can stay focused on the connection."
              interests={["Human-led", "Discreet", "Intentional"]}
              highlight
              variant="dark"
            />

            <div className="space-y-5 rounded-3xl border border-white/15 bg-white/5 p-8 text-sm leading-7 text-white/70">
              <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">How it unfolds</h2>
              <p>
                <span className="font-semibold text-white">Discovery.</span> A calm conversation to understand your pace and
                relationship vision.
              </p>
              <p>
                <span className="font-semibold text-white">Curation.</span> Handpicked introductions with context, chemistry, and
                shared intent.
              </p>
              <p>
                <span className="font-semibold text-white">Guidance.</span> Your matchmaker prepares every encounter and
                continues the follow-through.
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="relative z-10 flex justify-center px-6 pb-8 text-[0.6rem] uppercase tracking-[0.4em] text-white/40 md:px-10">
        © {currentYear} Bloom
      </footer>
    </div>
  );
};

export default ClientWelcome;
