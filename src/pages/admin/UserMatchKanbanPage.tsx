import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Plus, Heart, Clock, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProfileLibraryModal } from "@/components/ProfileLibraryModal";

interface OtherProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  city: string;
  country: string;
  profession: string;
  date_of_birth: string;
}

interface KanbanMatch {
  match_status: string;
  compatibility_score: number;
  other_profile: OtherProfile;
}

interface GroupedMatches {
  [key: string]: KanbanMatch[];
}

const KANBAN_COLUMNS = {
  pending: { title: "In Progress", icon: Clock },
  profile_1_accepted: { title: "Pending", icon: CheckCircle },
  profile_2_accepted: { title: "Pending", icon: CheckCircle },
  both_accepted: { title: "Mutual", icon: Heart },
  profile_1_rejected: { title: "Rejected", icon: XCircle },
  profile_2_rejected: { title: "Rejected", icon: XCircle },
  rejected: { title: "Rejected", icon: XCircle },
};

const UserMatchKanbanPage = () => {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [matches, setMatches] = useState<KanbanMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  useEffect(() => {
    if (profileId) {
      fetchKanbanMatches(profileId);
    }
  }, [profileId]);

  const fetchKanbanMatches = async (p_profile_id: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_matches_for_kanban', { p_profile_id });
      if (error) throw error;
      setMatches(data || []);
    } catch (error: any) {
      toast({ title: "Error fetching matches", description: "Could not load matches for the Kanban board.", variant: "destructive" });
      console.error("Error fetching Kanban matches:", error);
    } finally {
      setLoading(false);
    }
  };

  const groupedMatches = matches.reduce((acc, match) => {
    const column = KANBAN_COLUMNS[match.match_status as keyof typeof KANBAN_COLUMNS];
    if (column) {
      const title = column.title;
      if (!acc[title]) {
        acc[title] = [];
      }
      acc[title].push(match);
    }
    return acc;
  }, {} as GroupedMatches);

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return '';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <>
      <ProfileLibraryModal
        open={isLibraryOpen}
        onOpenChange={setIsLibraryOpen}
        sourceProfileId={profileId!}
        onSuggestSuccess={() => fetchKanbanMatches(profileId!)}
      />
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="max-w-full mx-auto">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-3xl font-bold text-gray-800">Match Kanban</h1>
            </div>
            <Button size="lg" onClick={() => setIsLibraryOpen(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Suggest More
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="flex gap-6 overflow-x-auto pb-4">
              {Object.entries(KANBAN_COLUMNS)
                .map(([key, { title, icon: Icon }]) => ({ title, icon: Icon }))
                .filter((v, i, a) => a.findIndex(t => t.title === v.title) === i)
                .map(({ title, icon: Icon }) => (
                  <div key={title} className="w-80 flex-shrink-0 bg-gray-100 rounded-lg">
                    <div className="p-3 flex items-center justify-between border-b border-gray-200">
                      <div className="flex items-center">
                        <Icon className="w-5 h-5 mr-3 text-gray-500" />
                        <h2 className="font-semibold text-gray-700">{title}</h2>
                      </div>
                      <span className="text-sm font-medium text-gray-500">{(groupedMatches[title] || []).length}</span>
                    </div>
                    <div className="p-2 space-y-3 overflow-y-auto h-[calc(100vh-20rem)]">
                      {(groupedMatches[title] || []).map((match, index) => {
                        const profile = match.other_profile;
                        const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
                        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
                        const age = calculateAge(profile.date_of_birth);

                        return (
                          <Card key={index} className="bg-white shadow-sm hover:shadow-md transition-shadow border-none">
                            <CardContent className="p-3">
                              <div className="flex items-start space-x-3">
                                <Avatar className="w-10 h-10">
                                  <AvatarFallback>{initials}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-800">{name}</p>
                                  <p className="text-sm text-gray-500">{age} years old</p>
                                  <p className="text-sm text-gray-500">{profile.city}, {profile.country}</p>
                                </div>
                              </div>
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                 <Badge variant="secondary">{match.compatibility_score}% Match</Badge>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UserMatchKanbanPage;
