import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Users, Shield, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center">
        {/* Content */}
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="animate-fade-in space-y-8">
            <div className="space-y-4">
              <h1 className="text-6xl md:text-7xl font-light text-foreground tracking-tight">
                BLOOM
              </h1>
              <div className="w-16 h-0.5 bg-accent mx-auto"></div>
            </div>

            <div className="space-y-6">
              <p className="text-xl md:text-2xl text-muted-foreground font-light max-w-2xl mx-auto leading-relaxed">
                Where meaningful connections flourish
              </p>
              <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                Experience personalized matchmaking with our sophisticated platform designed for premium matchmaking professionals.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <Link to="/client">
                <Button className="btn-premium min-w-[180px]">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button className="btn-soft min-w-[180px]">
                  Sign In
                  <Heart className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-6 bg-surface">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-light text-foreground">
              Thoughtfully designed for connection
            </h2>
            <div className="w-12 h-0.5 bg-accent mx-auto"></div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
              Our platform combines sophisticated technology with personalized service, creating meaningful connections through an elegant, intuitive experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
            {/* Admin Features */}
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-medium text-foreground">For Matchmakers</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Complete CRM system designed for professional matchmaking services.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full mr-3" />
                    Real-time dashboard with key metrics
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full mr-3" />
                    Advanced profile management
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full mr-3" />
                    Intelligent matching algorithms
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full mr-3" />
                    Access code generation & tracking
                  </div>
                </div>
                <Link to="/admin" className="inline-block pt-4">
                  <Button className="btn-soft">
                    Explore Admin Features
                  </Button>
                </Link>
              </div>
            </div>

            {/* Client Features */}
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                    <Heart className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <h3 className="text-xl font-medium text-foreground">For Clients</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Elegant portal designed for premium members seeking meaningful connections.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full mr-3" />
                    Sophisticated onboarding process
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full mr-3" />
                    Curated match suggestions
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full mr-3" />
                    Seamless communication tools
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full mr-3" />
                    Progress tracking & feedback
                  </div>
                </div>
                <Link to="/client" className="inline-block pt-4">
                  <Button className="btn-soft">
                    View Client Portal
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Key Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 mx-auto bg-muted rounded-full flex items-center justify-center">
                <Shield className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-foreground">Secure & Private</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Enterprise-grade security protecting your most sensitive information
                </p>
              </div>
            </div>
            <div className="text-center space-y-4">
              <div className="w-12 h-12 mx-auto bg-muted rounded-full flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-foreground">AI-Powered Matching</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Sophisticated algorithms for optimal compatibility analysis
                </p>
              </div>
            </div>
            <div className="text-center space-y-4">
              <div className="w-12 h-12 mx-auto bg-muted rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-foreground">Premium Community</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Exclusive network of verified, serious-minded individuals
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 px-6 bg-primary">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h3 className="text-2xl md:text-3xl font-light text-primary-foreground">
              Ready to begin?
            </h3>
            <div className="w-12 h-0.5 bg-accent mx-auto"></div>
          </div>
          <p className="text-lg text-primary-foreground/80 max-w-xl mx-auto font-light leading-relaxed">
            Join the future of premium matchmaking with our sophisticated platform designed for professionals who value excellence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link to="/admin">
              <Button className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-medium px-8 py-3 rounded-lg min-w-[160px]">
                Start Your Trial
              </Button>
            </Link>
            <Button className="bg-transparent text-primary-foreground border border-primary-foreground/30 hover:bg-primary-foreground/10 font-medium px-8 py-3 rounded-lg min-w-[160px]">
              Schedule Demo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
