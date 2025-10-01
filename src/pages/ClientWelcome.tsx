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
    <div className="relative min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--brand-secondary))]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(190,76,139,0.18),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-1/2 bg-[hsl(var(--surface))] md:block" />

      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-16 px-6 py-20 md:py-24 lg:flex-row lg:items-center lg:gap-24 lg:px-12">
        <motion.div
          className="flex-1 space-y-10"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--brand-secondary))] px-4 py-1 text-xs uppercase tracking-[0.3em] text-[hsl(var(--brand-secondary-foreground))]">
              <Sparkles className="h-3 w-3" /> Invitation only
            </span>
            <h1 className="font-display text-4xl leading-tight tracking-tight sm:text-5xl">
              The first step to an intentionally curated love life.
            </h1>
            <p className="max-w-xl text-base leading-7 text-muted-foreground">
              Enter the invitation code shared by your matchmaker to unlock your personalized onboarding experience.
              Bloom welcomes a limited number of members to ensure the experience remains intimate and considered.
            </p>
          </div>

          <motion.form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-3xl border border-[hsl(var(--brand-secondary))]/15 bg-[hsl(var(--background))] p-8 shadow-[0_28px_96px_-48px_rgba(18,18,18,0.45)] backdrop-blur"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          >
            <div className="space-y-2">
              <Label htmlFor="accessCode" className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Invitation code
              </Label>
              <Input
                id="accessCode"
                value={accessCode}
                onChange={(event) => setAccessCode(event.target.value.toUpperCase())}
                placeholder="BLOOM-2024"
                className="h-12 rounded-full border-[hsl(var(--brand-secondary))]/20 bg-[hsl(var(--surface))] text-center text-base tracking-[0.5em] uppercase"
                required
              />
            </div>
            <PremiumButton type="submit" disabled={isValidating || !accessCode.trim()} className="w-full justify-center">
              {isValidating ? "Verifying" : "Continue"}
            </PremiumButton>
            <div className="grid grid-cols-1 gap-3 text-xs uppercase tracking-[0.3em] text-muted-foreground sm:grid-cols-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" /> Verified privacy
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" /> Curated members
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Guided intros
              </div>
            </div>
          </motion.form>
        </motion.div>

        <motion.div
          className="flex-1 space-y-10"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
        >
          <ProfileCard
            name="Elise, Matchmaker"
            headline="20+ years orchestrating extraordinary first meetings"
            bio="We interview every member personally. Expect warmth, discretion, and a matchmaking ecosystem crafted for quality over quantity."
            interests={["Intentional dating", "Quiet luxury", "Intuitive pairing"]}
            highlight
          />

          <div className="space-y-6 rounded-3xl border border-[hsl(var(--brand-secondary))]/15 bg-[hsl(var(--surface))] p-10">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Membership cadence
            </h2>
            <div className="space-y-5 text-sm leading-7 text-muted-foreground">
              <p>
                <span className="font-semibold text-[hsl(var(--brand-secondary))]">Discovery.</span> Begin with a calm,
                private conversation so we understand your rhythm and relationship vision.
              </p>
              <p>
                <span className="font-semibold text-[hsl(var(--brand-secondary))]">Curation.</span> Receive
                hand-crafted dossiers that highlight chemistry, shared values, and conversation sparks.
              </p>
              <p>
                <span className="font-semibold text-[hsl(var(--brand-secondary))]">Guidance.</span> Your matchmaker
                coordinates every introduction—from first hello to thoughtfully paced follow-ups.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ClientWelcome;
