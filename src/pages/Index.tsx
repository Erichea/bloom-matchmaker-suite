import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Sparkles, Star, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { PremiumButton } from "@/components/experience/PremiumButton";
import { SwipeDeck } from "@/components/experience/SwipeDeck";
import { MatchList } from "@/components/experience/MatchList";
import { ProfileCard } from "@/components/experience/ProfileCard";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is authenticated and auth is not loading, redirect to dashboard
    if (!loading && user) {
      console.log('User is authenticated, redirecting to dashboard');
      navigate('/client/dashboard');
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
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--brand-secondary))]">
      <section className="relative flex min-h-screen flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(190,76,139,0.16),_transparent_55%)]" />
        <div className="absolute inset-y-0 right-0 -z-10 hidden w-1/2 bg-[hsl(var(--surface))] sm:block" />

        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 pb-16 pt-32 lg:flex-row lg:items-center lg:gap-20 lg:px-12">
          <div className="flex-1 space-y-8">
            <div className="space-y-6">
              <motion.span
                className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--brand-secondary))] px-4 py-1 text-xs uppercase tracking-[0.3em] text-[hsl(var(--brand-secondary-foreground))]"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <Sparkles className="h-3 w-3" /> Exclusive matchmaking
              </motion.span>
              <motion.h1
                className="font-display text-4xl leading-tight tracking-tight text-[hsl(var(--brand-secondary))] sm:text-5xl lg:text-6xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
              >
                Curated introductions for remarkable people.
              </motion.h1>
              <motion.p
                className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                BLOOM is a private community for intentional dating. We blend human intuition with data to
                orchestrate introductions that feel effortless, warm, and distinctly personal.
              </motion.p>
            </div>

            <motion.div
              className="flex flex-col gap-4 sm:flex-row"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
            >
              <Link to="/client" className="w-full sm:w-auto">
                <PremiumButton className="w-full sm:w-auto">
                  Begin your application
                  <ArrowRight className="ml-2 h-4 w-4" />
                </PremiumButton>
              </Link>
              <Link to="/auth" className="w-full sm:w-auto">
                <button className="w-full rounded-full border border-[hsl(var(--brand-secondary))]/20 bg-[hsl(var(--surface))] px-6 py-2 text-sm font-medium text-[hsl(var(--brand-secondary))] transition hover:border-[hsl(var(--brand-secondary))]/40">
                  I already have an account
                </button>
              </Link>
            </motion.div>

            <motion.div
              className="flex items-center gap-6 text-xs uppercase tracking-[0.3em] text-muted-foreground"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" /> Verified members
              </div>
              <div className="hidden h-3 w-px bg-muted sm:block" />
              <div className="hidden items-center gap-2 sm:flex">
                <Users className="h-4 w-4" /> Personalized matchmaking
              </div>
            </motion.div>
          </div>

          <motion.div
            className="relative mt-16 flex-1 lg:mt-0"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          >
            <SwipeDeck
              profiles={[
                {
                  id: "1",
                  name: "Amelia, 32",
                  location: "New York",
                  headline: "Creative director & jazz devotee",
                  bio: "Balancing gallery nights with sunrise yoga. Looking for someone curious about the world.",
                  interests: ["Art", "Jazz", "City escapes"],
                },
                {
                  id: "2",
                  name: "Harper, 29",
                  location: "Austin",
                  headline: "Investor exploring conscious hospitality",
                  bio: "Weekends between farmer's markets and bootstrapping boutique stays.",
                  interests: ["Design", "Slow travel", "Wine"],
                },
                {
                  id: "3",
                  name: "Miles, 35",
                  location: "San Francisco",
                  headline: "Founder | R&D at the intersection of health and tech",
                  bio: "Think long hikes, vinyl, and untangling elegant systems.",
                  interests: ["Wellness", "Architecture", "Analog moments"],
                },
              ]}
            />
          </motion.div>
        </div>
      </section>

      <section className="border-t border-border bg-[hsl(var(--surface))] py-24">
        <div className="mx-auto flex max-w-6xl flex-col gap-16 px-6 lg:flex-row lg:items-start lg:px-12">
          <div className="flex-1 space-y-6">
            <h2 className="text-3xl font-semibold tracking-tight text-[hsl(var(--brand-secondary))] md:text-4xl">
              A considered journey from introduction to connection.
            </h2>
            <p className="max-w-xl text-base leading-7 text-muted-foreground">
              We only introduce people who feel aligned—professionally, personally, and energetically. Expect
              thoughtful curation and a guided experience at every step.
            </p>
            <div className="grid gap-6 sm:grid-cols-2">
              {[
                {
                  title: "Curated profiles",
                  description: "Hand-selected members sourced through referrals and in-depth interviews.",
                },
                {
                  title: "Match previews",
                  description: "Receive elegant dossiers highlighting chemistry, values, and conversation sparks.",
                },
                {
                  title: "Concierge support",
                  description: "A dedicated matchmaker stays with you throughout each introduction.",
                },
                {
                  title: "Refined pacing",
                  description: "Thoughtfully spaced introductions—quality over quantity, always.",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-3xl border border-[hsl(var(--brand-secondary))]/10 bg-[hsl(var(--background))] p-6 shadow-[0_18px_60px_-36px_rgba(15,15,15,0.4)]"
                >
                  <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-4 text-sm leading-6 text-[hsl(var(--brand-secondary))]">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 space-y-8">
            <ProfileCard
              name="Meet your matchmaker"
              headline="Thoughtful guidance from discovery to the first date"
              bio="Every BLOOM member is paired with a dedicated matchmaker who learns their rhythm, their goals, and the nuances that matter."
              interests={["Connection", "Privacy", "Intuition"]}
              highlight
            />
            <MatchList
              title="Recent intros"
              highlightNew
              matches={[
                { id: "101", name: "Rowan", status: "new", compatibility: 92, subtitle: "Introduced this week" },
                { id: "102", name: "Cleo", status: "mutual", compatibility: 88, subtitle: "Planning second date" },
                { id: "103", name: "Luca", status: "pending", compatibility: 85, subtitle: "Awaiting response" },
              ]}
            />
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-[hsl(var(--background))] py-20">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-6 text-center lg:px-12">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--brand-secondary))]/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-muted-foreground">
              <Star className="h-3 w-3" /> Private membership
            </span>
            <h2 className="text-3xl font-semibold tracking-tight text-[hsl(var(--brand-secondary))] sm:text-4xl">
              Discover a matchmaking experience designed for people who value discretion.
            </h2>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              Interviews, curated introductions, and thoughtful follow-through. We limit membership to keep the
              experience elevated and personal.
            </p>
          </div>

          <Link to="/client">
            <PremiumButton className="px-10 py-3 text-base">Apply for membership</PremiumButton>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Index;
