import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus } from "lucide-react";

interface ProfileForSuggestion {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_already_suggested: boolean;
}

interface ProfileLibraryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceProfileId: string;
  onSuggestSuccess: () => void;
}

export const ProfileLibraryModal = ({ open, onOpenChange, sourceProfileId, onSuggestSuccess }: ProfileLibraryModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<ProfileForSuggestion[]>([]);
  const [selectedProfiles, setSelectedProfiles] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && sourceProfileId) {
      fetchProfiles();
    }
  }, [open, sourceProfileId]);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_profiles_for_suggestion', { p_profile_id: sourceProfileId });
      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      toast({ title: "Error", description: "Could not load profiles for suggestion.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProfile = (profileId: string) => {
    setSelectedProfiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(profileId)) {
        newSet.delete(profileId);
      } else {
        newSet.add(profileId);
      }
      return newSet;
    });
  };

  const handleSubmit = async () => {
    if (selectedProfiles.size === 0) {
      toast({ title: "No profiles selected", description: "Please select at least one profile to suggest.", variant: "default" });
      return;
    }
    if (!user) {
        toast({ title: "Authentication Error", description: "Could not authenticate user.", variant: "destructive" });
        return;
    }

    try {
      setSubmitting(true);
      console.log("Calling create_bulk_matches with:");
      console.log("p_profile_1_id:", sourceProfileId);
      console.log("p_profile_2_ids:", Array.from(selectedProfiles));
      console.log("p_suggested_by:", user.id);
      const { error } = await supabase.rpc('create_bulk_matches', {
        p_profile_1_id: sourceProfileId,
        p_profile_2_ids: Array.from(selectedProfiles),
        p_suggested_by: user.id
      });
      if (error) throw error;

      toast({ title: "Success!", description: `Suggested ${selectedProfiles.size} new match(es).` });
      onSuggestSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to create new matches.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Suggest More Matches</DialogTitle>
          <DialogDescription>Select profiles to suggest as a new match.</DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <ScrollArea className="h-96 pr-4">
            <div className="space-y-2">
              {profiles.map(profile => {
                const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
                const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
                return (
                  <div
                    key={profile.id}
                    className={`flex items-center space-x-4 p-3 rounded-md ${profile.is_already_suggested ? 'opacity-50' : 'cursor-pointer hover:bg-gray-100'}`}
                    onClick={() => !profile.is_already_suggested && handleSelectProfile(profile.id)}
                  >
                    <Checkbox
                      checked={selectedProfiles.has(profile.id)}
                      disabled={profile.is_already_suggested}
                    />
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{name}</p>
                      <p className="text-sm text-gray-500">{profile.email}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting || loading}>
            {submitting ? "Suggesting..." : `Suggest ${selectedProfiles.size} Match(es)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
