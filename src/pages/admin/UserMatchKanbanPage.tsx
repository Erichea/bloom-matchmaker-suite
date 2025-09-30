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
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
  match_id: string;
  match_status: string;
  compatibility_score: number;
  other_profile: OtherProfile;
}

interface GroupedMatches {
  [key: string]: KanbanMatch[];
}

const KANBAN_COLUMNS = {
  pending: { title: "In Progress", icon: Clock, key: "pending" },
  profile_1_accepted: { title: "Pending", icon: CheckCircle, key: "profile_1_accepted" },
  profile_2_accepted: { title: "Pending", icon: CheckCircle, key: "profile_2_accepted" },
  both_accepted: { title: "Mutual", icon: Heart, key: "both_accepted" },
  profile_1_rejected: { title: "Rejected", icon: XCircle, key: "profile_1_rejected" },
  profile_2_rejected: { title: "Rejected", icon: XCircle, key: "profile_2_rejected" },
  rejected: { title: "Rejected", icon: XCircle, key: "rejected" },
};

interface MatchCardProps {
  match: KanbanMatch;
  isDragging?: boolean;
}

const MatchCard = ({ match, isDragging }: MatchCardProps) => {
  const profile = match.other_profile;
  const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
  const age = calculateAge(profile.date_of_birth);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: match.match_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="bg-white shadow-sm hover:shadow-md transition-shadow border-none cursor-move">
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
    </div>
  );
};

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

const UserMatchKanbanPage = () => {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [matches, setMatches] = useState<KanbanMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

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

      // Add match_id to each match if it doesn't exist
      const matchesWithIds = (data || []).map((match: any, index: number) => ({
        ...match,
        match_id: match.match_id || `match-${index}`,
      }));

      setMatches(matchesWithIds);
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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeMatch = matches.find(m => m.match_id === active.id);
    const overId = over.id as string;

    // Check if dropped over a column
    const targetColumnKey = Object.entries(KANBAN_COLUMNS).find(
      ([key, val]) => val.title === overId
    )?.[0];

    if (activeMatch && targetColumnKey && activeMatch.match_status !== targetColumnKey) {
      // Update the match status
      updateMatchStatus(activeMatch.match_id, targetColumnKey);
    }
  };

  const updateMatchStatus = async (matchId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('matches')
        .update({ match_status: newStatus })
        .eq('id', matchId);

      if (error) throw error;

      // Update local state
      setMatches(matches.map(m =>
        m.match_id === matchId ? { ...m, match_status: newStatus } : m
      ));

      toast({ title: "Success", description: "Match status updated." });
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to update match status.", variant: "destructive" });
      console.error("Error updating match status:", error);
    }
  };

  const activeMatch = matches.find(m => m.match_id === activeId);

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
              <p className="text-gray-500 mt-1">Drag and drop matches to update their status</p>
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-6 overflow-x-auto pb-4">
                {Object.entries(KANBAN_COLUMNS)
                  .map(([key, { title, icon: Icon }]) => ({ key, title, icon: Icon }))
                  .filter((v, i, a) => a.findIndex(t => t.title === v.title) === i)
                  .map(({ key, title, icon: Icon }) => {
                    const columnMatches = groupedMatches[title] || [];
                    return (
                      <div key={title} className="w-80 flex-shrink-0 bg-gray-100 rounded-lg">
                        <div className="p-3 flex items-center justify-between border-b border-gray-200">
                          <div className="flex items-center">
                            <Icon className="w-5 h-5 mr-3 text-gray-500" />
                            <h2 className="font-semibold text-gray-700">{title}</h2>
                          </div>
                          <span className="text-sm font-medium text-gray-500">{columnMatches.length}</span>
                        </div>
                        <SortableContext
                          items={columnMatches.map(m => m.match_id)}
                          strategy={verticalListSortingStrategy}
                          id={title}
                        >
                          <div className="p-2 space-y-3 overflow-y-auto h-[calc(100vh-20rem)]">
                            {columnMatches.map((match) => (
                              <MatchCard key={match.match_id} match={match} />
                            ))}
                          </div>
                        </SortableContext>
                      </div>
                    );
                  })}
              </div>
              <DragOverlay>
                {activeMatch ? <MatchCard match={activeMatch} isDragging /> : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      </div>
    </>
  );
};

export default UserMatchKanbanPage;