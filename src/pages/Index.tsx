import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Users, Shield, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-image.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-accent/70 to-background/95" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          <div className="animate-fade-in">
            <h1 className="text-7xl md:text-8xl font-bold text-white mb-8 tracking-tight">
              <span className="block bg-gradient-to-r from-white via-accent-soft to-white bg-clip-text text-transparent">
                BLOOM
              </span>
            </h1>
            <p className="text-2xl md:text-3xl text-white/90 mb-4 max-w-4xl mx-auto leading-relaxed">
              Premium Matchmaking Service
            </p>
            <p className="text-lg md:text-xl text-white/80 mb-12 max-w-3xl mx-auto">
              Where meaningful connections flourish. Experience personalized matchmaking with our sophisticated CRM platform designed for premium matchmaking professionals.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up">
            <Link to="/client">
              <Button className="bg-white text-primary hover:bg-white/90 font-semibold px-8 py-4 text-lg rounded-xl min-w-[200px]">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button className="bg-white/10 text-white border-white/30 hover:bg-white/20 font-semibold px-8 py-4 text-lg rounded-xl min-w-[200px]">
                Sign In
                <Heart className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 px-6 bg-surface">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-foreground mb-6">
              Premium Matchmaking Platform
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              BLOOM combines sophisticated technology with personalized service to create meaningful connections. Our comprehensive CRM system empowers matchmakers while providing clients with an elegant, premium experience.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {/* Admin Features */}
            <Card className="card-premium group hover:shadow-glow transition-all duration-300">
              <CardHeader className="text-center">
                <div className="w-20 h-20 mx-auto bg-primary-muted rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Users className="h-10 w-10" />
                </div>
                <CardTitle className="text-2xl font-bold">Admin Interface</CardTitle>
                <CardDescription className="text-lg">
                  Complete CRM for matchmaking professionals
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3" />
                    Real-time dashboard with key metrics
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3" />
                    Advanced profile management
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3" />
                    Intelligent matching algorithms
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3" />
                    Access code generation & tracking
                  </li>
                </ul>
                <Link to="/admin" className="block pt-4">
                  <Button className="btn-premium w-full">
                    Explore Admin Features
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Client Features */}
            <Card className="card-premium group hover:shadow-glow transition-all duration-300">
              <CardHeader className="text-center">
                <div className="w-20 h-20 mx-auto bg-accent-muted rounded-2xl flex items-center justify-center mb-6 group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                  <Heart className="h-10 w-10" />
                </div>
                <CardTitle className="text-2xl font-bold">Client Experience</CardTitle>
                <CardDescription className="text-lg">
                  Elegant portal for premium members
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-accent rounded-full mr-3" />
                    Sophisticated onboarding process
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-accent rounded-full mr-3" />
                    Curated match suggestions
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-accent rounded-full mr-3" />
                    Seamless communication tools
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-accent rounded-full mr-3" />
                    Progress tracking & feedback
                  </li>
                </ul>
                <Link to="/client" className="block pt-4">
                  <Button className="btn-accent w-full">
                    View Client Portal
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Key Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-success-soft rounded-2xl flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
              <p className="text-muted-foreground">
                Enterprise-grade security protecting sensitive client information
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-primary-muted rounded-2xl flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Matching</h3>
              <p className="text-muted-foreground">
                Sophisticated algorithms for optimal compatibility analysis
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-accent-muted rounded-2xl flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Premium Community</h3>
              <p className="text-muted-foreground">
                Exclusive network of verified, serious-minded individuals
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 px-6 bg-[--gradient-hero]">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Matchmaking Business?
          </h3>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join the future of premium matchmaking with BLOOM's sophisticated platform designed for professionals who demand excellence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/admin">
              <Button className="bg-white text-primary hover:bg-white/90 font-semibold px-8 py-3 rounded-xl">
                Start Your Trial
              </Button>
            </Link>
            <Button className="bg-white/10 text-white border-white/30 hover:bg-white/20 font-semibold px-8 py-3 rounded-xl">
              Schedule Demo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
