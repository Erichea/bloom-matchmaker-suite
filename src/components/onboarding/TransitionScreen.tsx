import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Heart, Sparkles } from "lucide-react";

interface TransitionScreenProps {
  onContinue: () => void;
}

export const TransitionScreen = ({ onContinue }: TransitionScreenProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-6">
      <motion.div
        className="max-w-2xl w-full text-center space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Icon */}
        <motion.div
          className="flex justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
            <div className="relative bg-gradient-to-br from-primary to-primary/60 p-8 rounded-full">
              <Heart className="h-16 w-16 text-primary-foreground" fill="currentColor" />
            </div>
          </div>
        </motion.div>

        {/* Main content */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            Great progress!
          </div>

          <h1 className="font-display text-4xl md:text-5xl font-light leading-tight text-foreground">
            Now, let's talk about{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              what you're looking for
            </span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            We've gotten to know you. Now help us understand what matters most to you in a partner.
          </p>
        </motion.div>

        {/* Decorative elements */}
        <motion.div
          className="flex justify-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="h-1.5 w-16 bg-primary rounded-full" />
          <div className="h-1.5 w-1.5 bg-primary/40 rounded-full" />
          <div className="h-1.5 w-1.5 bg-primary/40 rounded-full" />
          <div className="h-1.5 w-1.5 bg-primary/40 rounded-full" />
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Button
            size="lg"
            onClick={onContinue}
            className="rounded-full h-14 px-8 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            Continue
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>

        {/* Bottom text */}
        <motion.p
          className="text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Just a few more questions to personalize your matches
        </motion.p>
      </motion.div>
    </div>
  );
};
