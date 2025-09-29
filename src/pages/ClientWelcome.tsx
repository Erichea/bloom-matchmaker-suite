import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Heart, Sparkles, Users, Shield } from "lucide-react";
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
                <h1 className="text-4xl md:text-5xl font-light text-foreground tracking-tight">
                  Welcome to BLOOM
                </h1>
                <div className="w-16 h-0.5 bg-accent mx-auto"></div>
              </div>
              <p className="text-lg text-muted-foreground font-light leading-relaxed">
                Your journey to meaningful connections begins here.
              </p>
            </div>

            {/* Access Code Form */}
            <Card className="card-premium animate-slide-up">
              <CardHeader className="text-center space-y-4">
                <CardTitle className="text-xl font-medium text-foreground">
                  Enter Your Access Code
                </CardTitle>
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
              return (
                <div key={index} className="text-center space-y-4">
                  <div className="w-12 h-12 mx-auto bg-muted rounded-full flex items-center justify-center">
                    <Icon className="h-5 w-5 text-muted-foreground" />
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
            Join our exclusive community and let us help you find lasting love.
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