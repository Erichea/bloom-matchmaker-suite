import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface ProfileOption {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  city: string | null;
  country: string | null;
  profession: string | null;
  primary_photo_url?: string | null;
  is_already_suggested: boolean;
}

interface SuggestMatchesModalProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  onMatchesCreated?: () => void;
}

export default function SuggestMatchesModal({
  open,
  onClose,
  clientId,
  clientName,
  onMatchesCreated,
}: SuggestMatchesModalProps) {
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (open) {
      loadProfiles();
      setSelectedIds(new Set());
      setSearchQuery("");
    }
  }, [open, clientId]);

  const loadProfiles = async () => {
    try {
      setLoading(true);

      // Fetch available profiles
      const { data: profilesData, error: profilesError } = await supabase.rpc(
        "get_profiles_for_suggestion",
        { p_profile_id: clientId }
      );

      if (profilesError) throw profilesError;

      // Fetch primary photos for each profile
      const profileIds = (profilesData || []).map((p: any) => p.id);

      if (profileIds.length > 0) {
        const { data: photosData, error: photosError } = await supabase
          .from("profile_photos")
          .select("profile_id, photo_url, is_primary, order_index")
          .in("profile_id", profileIds);

        if (photosError) throw photosError;

        // Group photos by profile_id
        const photosByProfile = (photosData || []).reduce(
          (acc: Record<string, any[]>, photo: any) => {
            if (!acc[photo.profile_id]) acc[photo.profile_id] = [];
            acc[photo.profile_id].push(photo);
            return acc;
          },
          {}
        );

        // Get primary photo for each profile
        const enrichedProfiles = (profilesData || []).map((profile: any) => {
          const photos = photosByProfile[profile.id] || [];
          const primaryPhoto = photos
            .sort((a, b) => {
              if (a.is_primary === b.is_primary) return (a.order_index || 0) - (b.order_index || 0);
              return a.is_primary ? -1 : 1;
            })[0];

          return {
            ...profile,
            primary_photo_url: primaryPhoto?.photo_url || null,
          };
        });

        setProfiles(enrichedProfiles);
      } else {
        setProfiles([]);
      }
    } catch (error: any) {
      console.error("Error loading profiles:", error);
      toast({
        title: "Failed to load profiles",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProfiles = useMemo(() => {
    if (!searchQuery.trim()) return profiles;

    const query = searchQuery.toLowerCase();
    return profiles.filter((profile) => {
      const name = `${profile.first_name || ""} ${profile.last_name || ""}`.toLowerCase();
      const email = (profile.email || "").toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }, [profiles, searchQuery]);

  const availableProfiles = filteredProfiles.filter((p) => !p.is_already_suggested);
  const alreadySuggestedProfiles = filteredProfiles.filter((p) => p.is_already_suggested);

  const toggleSelection = (profileId: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(profileId)) {
      newSelection.delete(profileId);
    } else {
      newSelection.add(profileId);
    }
    setSelectedIds(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === availableProfiles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(availableProfiles.map((p) => p.id)));
    }
  };

  const handleCreateMatches = async () => {
    if (selectedIds.size === 0) {
      toast({
        title: "No profiles selected",
        description: "Please select at least one profile to create matches",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);

      const { data, error } = await supabase.rpc("create_bulk_matches" as any, {
        p_profile_1_id: clientId,
        p_profile_2_ids: Array.from(selectedIds),
        p_suggested_by: user?.id,
      });

      if (error) throw error;

      const result = data as any;
      toast({
        title: "Matches created",
        description: `Successfully created ${result.created_count || selectedIds.size} match${selectedIds.size > 1 ? "es" : ""}`,
      });

      onMatchesCreated?.();
      onClose();
    } catch (error: any) {
      console.error("Error creating matches:", error);
      toast({
        title: "Failed to create matches",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const ProfileCard = ({ profile, disabled = false }: { profile: ProfileOption; disabled?: boolean }) => {
    const name = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Unnamed";
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const location = [profile.city, profile.country].filter(Boolean).join(", ");
    const isSelected = selectedIds.has(profile.id);

    return (
      <div
        className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
          disabled
            ? "bg-muted/30 opacity-60 cursor-not-allowed"
            : isSelected
              ? "border-primary bg-primary/5"
              : "hover:bg-muted/50 cursor-pointer"
        }`}
        onClick={() => !disabled && toggleSelection(profile.id)}
      >
        <Checkbox
          checked={isSelected}
          disabled={disabled}
          onCheckedChange={() => !disabled && toggleSelection(profile.id)}
          onClick={(e) => e.stopPropagation()}
        />

        <Avatar className="h-12 w-12">
          {profile.primary_photo_url ? (
            <AvatarImage src={profile.primary_photo_url} alt={name} />
          ) : (
            <AvatarFallback>{initials}</AvatarFallback>
          )}
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm truncate">{name}</h4>
            {disabled && <Badge variant="outline" className="text-xs">Already matched</Badge>}
          </div>
          <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
          {location && <p className="text-xs text-muted-foreground truncate">{location}</p>}
          {profile.profession && <p className="text-xs text-muted-foreground truncate">{profile.profession}</p>}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Suggest Matches for {clientName}</DialogTitle>
          <DialogDescription>
            Select profiles to create match suggestions. Selected profiles will be added to the matches list.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Selection Controls */}
          {availableProfiles.length > 0 && (
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={loading}
              >
                {selectedIds.size === availableProfiles.length ? "Deselect All" : "Select All"}
              </Button>
              <span className="text-sm text-muted-foreground">
                {selectedIds.size} selected
              </span>
            </div>
          )}

          {/* Profiles List */}
          <ScrollArea className="h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredProfiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="font-medium">No profiles found</p>
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "Try adjusting your search" : "All profiles have been matched"}
                </p>
              </div>
            ) : (
              <div className="space-y-6 pr-4">
                {/* Available Profiles */}
                {availableProfiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Available Profiles ({availableProfiles.length})
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {availableProfiles.map((profile) => (
                        <ProfileCard key={profile.id} profile={profile} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Already Suggested */}
                {alreadySuggestedProfiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Already Matched ({alreadySuggestedProfiles.length})
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {alreadySuggestedProfiles.map((profile) => (
                        <ProfileCard key={profile.id} profile={profile} disabled />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={creating}>
            Cancel
          </Button>
          <Button onClick={handleCreateMatches} disabled={selectedIds.size === 0 || creating}>
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>Create {selectedIds.size} Match{selectedIds.size !== 1 ? "es" : ""}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
