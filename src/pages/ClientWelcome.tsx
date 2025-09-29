import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Heart, Sparkles, Users, Shield, Coffee, Smile, Star, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ClientWelcome = () => {
  const [accessCode, setAccessCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsValidating(true);
    
    try {
      console.log('Validating access code:', accessCode.trim().toUpperCase());

      // Validate access code (case insensitive)
      const { data: codeData, error } = await supabase
        .from('access_codes')
        .select('*')
        .eq('code', accessCode.trim().toUpperCase())
        .eq('is_used', false)
        .single();

      console.log('Access code validation result:', { codeData, error });

      if (error || !codeData) {
        console.error('Access code validation failed:', error);
        toast({
          title: "Invalid Access Code",
          description: error?.message || "The access code you entered is invalid or has already been used.",
          variant: "destructive",
        });
        setIsValidating(false);
        return;
      }

      // Check if code is expired
      if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
        toast({
          title: "Expired Access Code",
          description: "This access code has expired. Please contact your matchmaker for a new code.",
          variant: "destructive",
        });
        setIsValidating(false);
        return;
      }

      // Store access code in session storage for profile creation
      sessionStorage.setItem('validAccessCode', accessCode.trim().toUpperCase());
      
      toast({
        title: "Access Code Verified",
        description: "Welcome to BLOOM! Let's create your account.",
      });

      navigate("/auth");
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
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
      <div className="relative min-h-screen flex items-center justify-center">
        {/* Content */}
        <div className="max-w-lg mx-auto px-6 text-center">
          <div className="animate-fade-in space-y-12">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-3">
                  <Sparkles className="h-6 w-6 text-accent animate-float" />
                  <h1 className="text-4xl md:text-5xl font-light text-foreground tracking-tight">
                    Welcome to BLOOM
                  </h1>
                  <Heart className="h-6 w-6 text-accent animate-pulse-soft" />
                </div>
                <div className="w-16 h-0.5 bg-accent mx-auto"></div>
              </div>
              <p className="text-lg text-muted-foreground font-light leading-relaxed">
                Your journey to meaningful connections begins here. <span className="fun-emoji">🌟</span>
              </p>

              {/* Fun welcome traits */}
              <div className="flex flex-wrap justify-center gap-2 max-w-sm mx-auto">
                {[
                  { icon: Coffee, text: "Ready to mingle", emoji: "😊" },
                  { icon: Smile, text: "Open minded", emoji: "🤗" },
                  { icon: Star, text: "Hopeful romantic", emoji: "💕" }
                ].map((trait, index) => {
                  const Icon = trait.icon;
                  return (
                    <div
                      key={index}
                      className="trait-tag animate-fade-in love-burst"
                      style={{animationDelay: `${index * 0.2}s`}}
                      onClick={() => {
                        const elem = document.querySelector(`[data-welcome-trait="${index}"]`);
                        elem?.classList.add('secret-animation');
                        setTimeout(() => elem?.classList.remove('secret-animation'), 600);
                      }}
                      data-welcome-trait={index}
                    >
                      <span className="fun-emoji mr-1">{trait.emoji}</span>
                      {trait.text}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Access Code Form */}
            <Card className="card-premium animate-slide-up group hover:shadow-[--shadow-medium] transition-all duration-300">
              <CardHeader className="text-center space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  <Zap className="h-5 w-5 text-accent animate-wiggle" />
                  <CardTitle className="text-xl font-medium text-foreground">
                    Enter Your Access Code
                  </CardTitle>
                </div>
                <CardDescription className="text-muted-foreground">
                  Please enter the exclusive code you received to begin.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="accessCode" className="text-sm font-medium text-muted-foreground">
                      Access Code
                    </Label>
                    <Input
                      id="accessCode"
                      type="text"
                      placeholder="Enter your code"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                      className="input-premium text-center text-base tracking-wider"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="btn-premium w-full"
                    disabled={isValidating || !accessCode.trim()}
                  >
                    {isValidating ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Validating...
                      </div>
                    ) : (
                      "Continue"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-6 bg-surface">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-2xl md:text-3xl font-light text-foreground">
              Why choose BLOOM?
            </h2>
            <div className="w-12 h-0.5 bg-accent mx-auto"></div>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto font-light leading-relaxed">
              Experience premium matchmaking with personalized service and proven results.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const animations = ['animate-float', 'animate-bounce-gentle', 'animate-pulse-soft', 'animate-wiggle'];
              const gradients = [
                'from-accent/20 to-accent/10',
                'from-primary/20 to-primary/10',
                'from-success/20 to-success/10',
                'from-muted to-muted-soft'
              ];
              return (
                <div key={index} className="text-center space-y-4 group">
                  <div className={`illustration-icon mx-auto bg-gradient-to-br ${gradients[index]} group-hover:scale-110`}>
                    <Icon className={`h-6 w-6 text-muted-foreground ${animations[index]}`} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium text-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 px-6 bg-primary">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h3 className="text-2xl font-light text-primary-foreground">
              Ready to find your perfect match?
            </h3>
            <div className="w-12 h-0.5 bg-accent mx-auto"></div>
          </div>
          <p className="text-lg text-primary-foreground/80 font-light leading-relaxed">
            Join our exclusive community and let us help you find lasting love. <span className="fun-emoji">💝</span>
          </p>
          <Button className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-medium px-8 py-3 rounded-lg">
            Get Your Access Code
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClientWelcome;