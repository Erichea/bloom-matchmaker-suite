import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Heart, Sparkles, Users, Shield } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

const ClientWelcome = () => {
  const [accessCode, setAccessCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsValidating(true);
    
    // Simulate validation
    setTimeout(() => {
      setIsValidating(false);
      // Here you would validate the access code
      console.log("Validating code:", accessCode);
    }, 1500);
  };

  const features = [
    {
      icon: Heart,
      title: "Curated Matches",
      description: "Handpicked matches based on deep compatibility analysis"
    },
    {
      icon: Users,
      title: "Premium Members",
      description: "Exclusive community of verified, serious-minded singles"
    },
    {
      icon: Sparkles,
      title: "Personalized Service",
      description: "Dedicated matchmaker guidance throughout your journey"
    },
    {
      icon: Shield,
      title: "Privacy & Security",
      description: "Your information is protected with the highest standards"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-accent/60 to-background/90" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="animate-fade-in">
            <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 tracking-tight">
              Welcome to
              <span className="block bg-gradient-to-r from-accent-soft to-white bg-clip-text text-transparent">
                BLOOM
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-2xl mx-auto leading-relaxed">
              Where meaningful connections flourish. Your journey to finding the perfect match begins here.
            </p>
          </div>

          {/* Access Code Form */}
          <Card className="card-premium max-w-md mx-auto animate-slide-up">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-semibold text-foreground">
                Enter Your Access Code
              </CardTitle>
              <CardDescription>
                Ready to start your matchmaking journey? Enter the exclusive code you received.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="accessCode" className="text-sm font-medium">
                    Access Code
                  </Label>
                  <Input
                    id="accessCode"
                    type="text"
                    placeholder="Enter your access code"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    className="input-premium text-center text-lg tracking-wider"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="btn-premium w-full py-3"
                  disabled={isValidating || !accessCode.trim()}
                >
                  {isValidating ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Validating...
                    </div>
                  ) : (
                    "Begin Your Journey"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 px-6 bg-surface">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Why Choose BLOOM?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience premium matchmaking with personalized service and proven results.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="card-premium text-center group hover:shadow-glow transition-all duration-300">
                  <CardHeader>
                    <div className="w-16 h-16 mx-auto bg-primary-muted rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 px-6 bg-[--gradient-hero]">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold text-white mb-6">
            Ready to Find Your Perfect Match?
          </h3>
          <p className="text-xl text-white/90 mb-8">
            Join our exclusive community and let us help you find lasting love.
          </p>
          <Button className="bg-white text-primary hover:bg-white/90 font-semibold px-8 py-3 rounded-xl">
            Get Your Access Code
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClientWelcome;