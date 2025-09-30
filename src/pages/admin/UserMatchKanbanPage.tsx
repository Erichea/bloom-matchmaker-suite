import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Plus, Heart, Clock, CheckCircle, XCircle, GripVertical } from "lucide-react";
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
  pending: { title: "In Progress", icon: Clock, key: "pending", color: "bg-blue-50 border-blue-200" },
  profile_1_accepted: { title: "Pending", icon: CheckCircle, key: "profile_1_accepted", color: "bg-yellow-50 border-yellow-200" },
  profile_2_accepted: { title: "Pending", icon: CheckCircle, key: "profile_2_accepted", color: "bg-yellow-50 border-yellow-200" },
  both_accepted: { title: "Mutual", icon: Heart, key: "both_accepted", color: "bg-green-50 border-green-200" },
  profile_1_rejected: { title: "Rejected", icon: XCircle, key: "profile_1_rejected", color: "bg-red-50 border-red-200" },
  profile_2_rejected: { title: "Rejected", icon: XCircle, key: "profile_2_rejected", color: "bg-red-50 border-red-200" },
  rejected: { title: "Rejected", icon: XCircle, key: "rejected", color: "bg-red-50 border-red-200" },
};

interface MatchCardProps {
  match: KanbanMatch;
  isDragging?: boolean;
  isCompact?: boolean;
}

const MatchCard = ({ match, isDragging, isCompact = false }: MatchCardProps) => {
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
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className="bg-white shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 group">
        <CardContent className={isCompact ? "p-2" : "p-3"}>
          <div className="flex items-center gap-2">
            <div {...listeners} className="cursor-grab active:cursor-grabbing">
              <GripVertical className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
            </div>
            <Avatar className={isCompact ? "w-8 h-8" : "w-10 h-10"}>
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-gray-800 truncate ${isCompact ? "text-sm" : "text-base"}`}>
                {name}
              </p>
              <p className={`text-gray-500 truncate ${isCompact ? "text-xs" : "text-sm"}`}>
                {age} • {profile.city}
              </p>
            </div>
            <Badge variant="secondary" className={isCompact ? "text-xs px-1.5 py-0" : "text-xs"}>
              {match.compatibility_score}%
            </Badge>
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

// Mobile list view component
const MobileListView = ({ matches, profileId }: { matches: KanbanMatch[]; profileId: string }) => {
  const { toast } = useToast();
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

  return (
    <div className="space-y-4">
      {Object.entries(KANBAN_COLUMNS)
        .map(([key, { title, icon: Icon, color }]) => ({ key, title, icon: Icon, color }))
        .filter((v, i, a) => a.findIndex(t => t.title === v.title) === i)
        .map(({ key, title, icon: Icon, color }) => {
          const columnMatches = groupedMatches[title] || [];
          if (columnMatches.length === 0) return null;

          return (
            <div key={title} className={`rounded-lg border-2 ${color} p-3`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-800">{title}</h3>
                </div>
                <Badge variant="outline" className="text-xs">{columnMatches.length}</Badge>
              </div>
              <div className="space-y-2">
                {columnMatches.map((match) => (
                  <MatchCard key={match.match_id} match={match} isCompact />
                ))}
              </div>
            </div>
          );
        })}
    </div>
  );
};

const UserMatchKanbanPage = () => {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [matches, setMatches] = useState<KanbanMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

    const targetColumnKey = Object.entries(KANBAN_COLUMNS).find(
      ([key, val]) => val.title === overId
    )?.[0];

    if (activeMatch && targetColumnKey && activeMatch.match_status !== targetColumnKey) {
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="p-4 md:p-6 lg:p-8">
          <div className="max-w-[1600px] mx-auto">
            <div className="mb-4 md:mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div>
                <Button
                  variant="ghost"
                  onClick={() => navigate(-1)}
                  className="mb-2 text-gray-600 hover:text-gray-900 -ml-2"
                  size="sm"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Match Board</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {isMobile ? "Tap to view • Swipe to manage" : "Drag and drop to update status"}
                </p>
              </div>
              <Button size="lg" onClick={() => setIsLibraryOpen(true)} className="w-full sm:w-auto">
                <Plus className="w-5 h-5 mr-2" />
                Suggest More
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
              </div>
            ) : isMobile ? (
              <MobileListView matches={matches} profileId={profileId!} />
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                  {Object.entries(KANBAN_COLUMNS)
                    .map(([key, { title, icon: Icon, color }]) => ({ key, title, icon: Icon, color }))
                    .filter((v, i, a) => a.findIndex(t => t.title === v.title) === i)
                    .map(({ key, title, icon: Icon, color }) => {
                      const columnMatches = groupedMatches[title] || [];
                      return (
                        <div key={title} className={`rounded-lg border-2 ${color} bg-white/50 backdrop-blur-sm flex flex-col`}>
                          <div className="p-3 flex items-center justify-between border-b border-gray-200 bg-white/80">
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4 text-gray-600" />
                              <h2 className="font-semibold text-gray-800 text-sm">{title}</h2>
                            </div>
                            <Badge variant="outline" className="text-xs font-semibold">
                              {columnMatches.length}
                            </Badge>
                          </div>
                          <SortableContext
                            items={columnMatches.map(m => m.match_id)}
                            strategy={verticalListSortingStrategy}
                            id={title}
                          >
                            <div className="p-2 space-y-2 overflow-y-auto flex-1 min-h-[200px] max-h-[calc(100vh-280px)]">
                              {columnMatches.map((match) => (
                                <MatchCard key={match.match_id} match={match} isCompact />
                              ))}
                              {columnMatches.length === 0 && (
                                <div className="text-center text-gray-400 text-sm py-8">
                                  No matches
                                </div>
                              )}
                            </div>
                          </SortableContext>
                        </div>
                      );
                    })}
                </div>
                <DragOverlay>
                  {activeMatch ? <MatchCard match={activeMatch} isDragging isCompact /> : null}
                </DragOverlay>
              </DndContext>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default UserMatchKanbanPage;