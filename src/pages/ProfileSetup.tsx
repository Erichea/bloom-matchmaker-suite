import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle } from "lucide-react";

const ProfileSetup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    dateOfBirth: "",
    gender: "",
    country: "",
    city: "",
    profession: "",
    education: "",
    relationshipStatus: "",
    aboutMe: "",
    preferredGender: "",
    preferredMinAge: "",
    preferredMaxAge: "",
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    // Pre-fill email and names if available
    if (user.email) {
      setProfileData(prev => ({ ...prev, email: user.email || "" }));
    }
    if (user.user_metadata?.first_name) {
      setProfileData(prev => ({ ...prev, firstName: user.user_metadata.first_name }));
    }
    if (user.user_metadata?.last_name) {
      setProfileData(prev => ({ ...prev, lastName: user.user_metadata.last_name }));
    }
  }, [user, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .insert([{
          user_id: user.id,
          first_name: profileData.firstName || null,
          last_name: profileData.lastName || null,
          email: profileData.email || null,
          date_of_birth: profileData.dateOfBirth || null,
          gender: (profileData.gender as any) || null,
          country: profileData.country || null,
          city: profileData.city || null,
          profession: profileData.profession || null,
          education: (profileData.education as any) || null,
          relationship_status: (profileData.relationshipStatus as any) || null,
          about_me: profileData.aboutMe || null,
          preferred_gender: (profileData.preferredGender as any) || null,
          preferred_min_age: parseInt(profileData.preferredMinAge) || null,
          preferred_max_age: parseInt(profileData.preferredMaxAge) || null,
          status: 'incomplete',
          completion_percentage: 0
        }]);

      if (error) {
        throw error;
      }

      toast({
        title: "Profile Created",
        description: "Your profile has been created successfully. It's now pending review.",
      });

      navigate("/client/dashboard");
    } catch (error: any) {
      console.error("Profile creation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const progress = (currentStep / 4) * 100;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Step 1</span>
              <h3 className="text-lg font-semibold text-[hsl(var(--brand-secondary))]">Basic information</h3>
              <p className="text-sm leading-6 text-muted-foreground">
                Tell us who you are so your matchmaker can introduce you with intention.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={profileData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  placeholder="Your first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={profileData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  placeholder="Your last name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="your@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={profileData.dateOfBirth}
                onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={profileData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="non_binary">Non-binary</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Step 2</span>
              <h3 className="text-lg font-semibold text-[hsl(var(--brand-secondary))]">Location & background</h3>
              <p className="text-sm leading-6 text-muted-foreground">
                Your story is anchored in a place—help us paint that atmosphere for future matches.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={profileData.country}
                  onChange={(e) => handleInputChange("country", e.target.value)}
                  placeholder="Your country"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={profileData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="Your city"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profession">Profession</Label>
              <Input
                id="profession"
                value={profileData.profession}
                onChange={(e) => handleInputChange("profession", e.target.value)}
                placeholder="Your profession"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="education">Education Level</Label>
              <Select value={profileData.education} onValueChange={(value) => handleInputChange("education", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your education level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high_school">High School</SelectItem>
                  <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                  <SelectItem value="master">Master's Degree</SelectItem>
                  <SelectItem value="phd">PhD</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="relationshipStatus">Relationship Status</Label>
              <Select value={profileData.relationshipStatus} onValueChange={(value) => handleInputChange("relationshipStatus", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your relationship status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="divorced">Divorced</SelectItem>
                  <SelectItem value="widowed">Widowed</SelectItem>
                  <SelectItem value="separated">Separated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Step 3</span>
              <h3 className="text-lg font-semibold text-[hsl(var(--brand-secondary))]">Your essence</h3>
              <p className="text-sm leading-6 text-muted-foreground">
                Share a glimpse of your world—interests, rhythms, and what lights you up.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="aboutMe">About Me</Label>
              <Textarea
                id="aboutMe"
                value={profileData.aboutMe}
                onChange={(e) => handleInputChange("aboutMe", e.target.value)}
                placeholder="Tell us about yourself, your interests, and what you're looking for..."
                rows={6}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Step 4</span>
              <h3 className="text-lg font-semibold text-[hsl(var(--brand-secondary))]">Preferences</h3>
              <p className="text-sm leading-6 text-muted-foreground">
                Outline what feels aligned so we can introduce people who fit naturally into your life.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferredGender">Preferred Gender</Label>
              <Select value={profileData.preferredGender} onValueChange={(value) => handleInputChange("preferredGender", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select preferred gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="non_binary">Non-binary</SelectItem>
                  <SelectItem value="any">Any</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preferredMinAge">Minimum Age</Label>
                <Input
                  id="preferredMinAge"
                  type="number"
                  value={profileData.preferredMinAge}
                  onChange={(e) => handleInputChange("preferredMinAge", e.target.value)}
                  placeholder="25"
                  min="18"
                  max="100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferredMaxAge">Maximum Age</Label>
                <Input
                  id="preferredMaxAge"
                  type="number"
                  value={profileData.preferredMaxAge}
                  onChange={(e) => handleInputChange("preferredMaxAge", e.target.value)}
                  placeholder="45"
                  min="18"
                  max="100"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative min-h-screen bg-[hsl(var(--background))]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(190,76,139,0.16),_transparent_60%)]" />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-16 lg:flex-row lg:items-start lg:px-12">
        <aside className="flex-1 space-y-10">
          <ProfileCard
            name={`${profileData.firstName || "Your"} ${profileData.lastName || "Profile"}`.trim()}
            location={[profileData.city, profileData.country].filter(Boolean).join(", ") || undefined}
            headline={profileData.profession || "Share your story"}
            bio={
              profileData.aboutMe ||
              "Introduce yourself with warmth and clarity. Highlight the passions and rituals that make your days meaningful."
            }
            interests={profileData.preferredGender ? ["Intentional", "Sincere", "Aligned"] : undefined}
            highlight
          />

          <div className="rounded-3xl border border-[hsl(var(--brand-secondary))]/15 bg-[hsl(var(--surface))] p-8">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Guidance
            </h2>
            <ul className="mt-6 space-y-4 text-sm leading-6 text-muted-foreground">
              <li>• Use vivid language—your matchmaker will use this to craft introductions.</li>
              <li>• Note what energises you outside of work. Shared cadence builds chemistry.</li>
              <li>• Preferences are flexible; adjust them anytime to keep matches in sync.</li>
            </ul>
          </div>
        </aside>

        <section className="flex-1 space-y-8 rounded-3xl border border-[hsl(var(--brand-secondary))]/20 bg-[hsl(var(--background))] p-10 shadow-[0_32px_120px_-64px_rgba(18,18,18,0.5)] backdrop-blur">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Profile setup</span>
                <h1 className="text-2xl font-semibold tracking-tight text-[hsl(var(--brand-secondary))]">
                  Craft your introduction
                </h1>
              </div>
              <div className="text-right">
                <Progress value={progress} className="h-2 w-40 rounded-full bg-[hsl(var(--surface))]" />
                <p className="mt-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Step {currentStep} of 4
                </p>
              </div>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              These details remain private to your matchmaker and are used solely to curate aligned introductions.
            </p>
          </div>

          <div className="space-y-8">{renderStep()}</div>

          <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:justify-between">
            <Button
              variant="outline"
              className="rounded-full border-[hsl(var(--brand-secondary))]/20 px-6 text-sm"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              Previous
            </Button>

            {currentStep < 4 ? (
              <PremiumButton onClick={handleNext} className="justify-center">
                Continue
              </PremiumButton>
            ) : (
              <PremiumButton onClick={handleSubmit} disabled={loading} className="justify-center">
                {loading ? "Saving" : "Complete profile"}
                <CheckCircle className="ml-2 h-4 w-4" />
              </PremiumButton>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProfileSetup;
