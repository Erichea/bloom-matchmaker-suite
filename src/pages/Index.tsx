import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Users, Shield, ArrowRight, Sparkles, Coffee, Music, BookOpen, Camera, Plane, Star, Zap, Moon, Sun, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Welcome Section */}
      <div className="relative min-h-screen flex items-center justify-center">
        {/* Content */}
        <div className="max-w-2xl mx-auto px-6 text-center">
          <div className="animate-fade-in space-y-12">
            <div className="space-y-6">
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl font-light text-foreground tracking-tight">
                  Welcome to BLOOM
                </h1>
                <div className="w-16 h-0.5 bg-accent mx-auto"></div>
              </div>
              <p className="text-xl md:text-2xl text-muted-foreground font-light leading-relaxed">
                Your journey to meaningful connections starts here <span className="fun-emoji">🌸</span>
              </p>
            </div>

            {/* Personal Touch */}
            <div className="bg-accent/20 rounded-lg p-6 space-y-4">
              <p className="text-lg text-foreground font-light">
                Ready to find your perfect match?
              </p>
              <p className="text-sm text-muted-foreground">
                Join our exclusive community and let me help you discover lasting love through personalized matchmaking.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link to="/client" className="w-full sm:w-auto">
                  <Button className="btn-premium w-full sm:min-w-[200px] group">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/auth" className="w-full sm:w-auto">
                  <Button className="btn-soft w-full sm:min-w-[200px] group">
                    I Have an Account
                    <Heart className="ml-2 h-4 w-4 group-hover:animate-pulse-soft transition-all" />
                  </Button>
                </Link>
              </div>

              <p className="text-xs text-muted-foreground">
                New here? Start with "Get Started" to begin your journey
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* What to Expect Section */}
      <div className="py-20 px-6 bg-surface">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-2xl md:text-3xl font-light text-foreground">
              What to expect
            </h2>
            <div className="w-12 h-0.5 bg-accent mx-auto"></div>
          </div>

          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center space-y-4">
                <div className="illustration-icon mx-auto bg-gradient-to-br from-primary/20 to-primary/10">
                  <UserPlus className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-foreground">1. Create Profile</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Tell us about yourself and what you're looking for
                  </p>
                </div>
              </div>

              <div className="text-center space-y-4">
                <div className="illustration-icon mx-auto bg-gradient-to-br from-accent/30 to-accent/20">
                  <Heart className="h-6 w-6 text-accent-foreground animate-pulse-soft" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-foreground">2. Get Matched</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Receive carefully curated matches based on compatibility
                  </p>
                </div>
              </div>

              <div className="text-center space-y-4">
                <div className="illustration-icon mx-auto bg-gradient-to-br from-success/20 to-success/10">
                  <Sparkles className="h-6 w-6 text-success animate-float" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-foreground">3. Connect</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Start meaningful conversations with your matches
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simple CTA */}
      <div className="py-16 px-6">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <p className="text-lg text-muted-foreground font-light">
            Ready to find love? <span className="fun-emoji">💕</span>
          </p>
          <Link to="/client">
            <Button className="btn-premium px-8 py-3">
              Start Your Journey
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
