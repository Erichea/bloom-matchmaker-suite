import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, ArrowRight, User, Heart, MapPin, Briefcase } from "lucide-react";

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
        .insert({
          user_id: user.id,
          first_name: profileData.firstName || null,
          last_name: profileData.lastName || null,
          email: profileData.email || null,
          date_of_birth: profileData.dateOfBirth || null,
          gender: profileData.gender || null,
          country: profileData.country || null,
          city: profileData.city || null,
          profession: profileData.profession || null,
          education: profileData.education || null,
          relationship_status: profileData.relationshipStatus || null,
          about_me: profileData.aboutMe || null,
          preferred_gender: profileData.preferredGender || null,
          preferred_min_age: parseInt(profileData.preferredMinAge) || null,
          preferred_max_age: parseInt(profileData.preferredMaxAge) || null,
          status: 'incomplete',
          completion_percentage: 0
        });

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
            <div className="text-center mb-6">
              <User className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold">Basic Information</h3>
              <p className="text-muted-foreground">Let's start with your basic details</p>
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
            <div className="text-center mb-6">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold">Location & Background</h3>
              <p className="text-muted-foreground">Tell us about your location and background</p>
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
            <div className="text-center mb-6">
              <Briefcase className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold">About You</h3>
              <p className="text-muted-foreground">Share more about yourself</p>
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
            <div className="text-center mb-6">
              <Heart className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold">Partner Preferences</h3>
              <p className="text-muted-foreground">Tell us about your ideal match</p>
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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <Card className="card-premium">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Complete Your Profile</CardTitle>
            <CardDescription className="text-lg">
              Help us find your perfect match by completing your profile
            </CardDescription>
            <div className="mt-6">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground mt-2">
                Step {currentStep} of 4 ({Math.round(progress)}% complete)
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {renderStep()}
            
            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
              >
                Previous
              </Button>
              
              {currentStep < 4 ? (
                <Button onClick={handleNext} className="btn-premium">
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading} className="btn-premium">
                  {loading ? "Creating Profile..." : (
                    <>
                      Complete Profile
                      <CheckCircle className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileSetup;