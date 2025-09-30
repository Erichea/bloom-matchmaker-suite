import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Plus, Heart, Clock, CheckCircle, XCircle, GripVertical, Sparkles } from "lucide-react";
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
  pending: {
    title: "In Progress",
    icon: Clock,
    key: "pending",
    bgColor: "bg-accent-soft",
    iconColor: "text-accent",
    badgeColor: "badge-neutral"
  },
  profile_1_accepted: {
    title: "Pending",
    icon: CheckCircle,
    key: "profile_1_accepted",
    bgColor: "bg-warning-soft",
    iconColor: "text-warning",
    badgeColor: "badge-warning"
  },
  profile_2_accepted: {
    title: "Pending",
    icon: CheckCircle,
    key: "profile_2_accepted",
    bgColor: "bg-warning-soft",
    iconColor: "text-warning",
    badgeColor: "badge-warning"
  },
  both_accepted: {
    title: "Mutual Match",
    icon: Heart,
    key: "both_accepted",
    bgColor: "bg-success-soft",
    iconColor: "text-success",
    badgeColor: "badge-success"
  },
  profile_1_rejected: {
    title: "Rejected",
    icon: XCircle,
    key: "profile_1_rejected",
    bgColor: "bg-destructive-soft",
    iconColor: "text-destructive",
    badgeColor: "badge-error"
  },
  profile_2_rejected: {
    title: "Rejected",
    icon: XCircle,
    key: "profile_2_rejected",
    bgColor: "bg-destructive-soft",
    iconColor: "text-destructive",
    badgeColor: "badge-error"
  },
  rejected: {
    title: "Rejected",
    icon: XCircle,
    key: "rejected",
    bgColor: "bg-destructive-soft",
    iconColor: "text-destructive",
    badgeColor: "badge-error"
  },
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
    opacity: isDragging ? 0.4 : 1,
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-success text-success-foreground";
    if (score >= 60) return "bg-accent text-accent-foreground";
    if (score >= 40) return "bg-warning text-warning-foreground";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className={`
        card-interactive
        transition-all duration-200
        ${isDragging ? 'rotate-3 shadow-xl scale-105' : ''}
      `}>
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div
              {...listeners}
              className="cursor-grab active:cursor-grabbing touch-none flex-shrink-0 hover:scale-110 transition-transform"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
            </div>

            <Avatar className="w-10 h-10 ring-2 ring-border">
              <AvatarFallback className="text-xs font-semibold bg-accent text-accent-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate text-sm leading-tight">
                {name}
              </p>
              <p className="text-xs text-muted-foreground truncate leading-tight mt-0.5">
                {age} • {profile.city}
              </p>
            </div>

            <div className={`
              ${getScoreColor(match.compatibility_score)}
              px-2.5 py-1 rounded-full text-xs font-semibold
              shadow-sm flex-shrink-0
            `}>
              {match.compatibility_score}%
            </div>
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
const MobileListView = ({ matches }: { matches: KanbanMatch[] }) => {
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
        .map(([key, { title, icon: Icon, bgColor, iconColor, badgeColor }]) =>
          ({ key, title, icon: Icon, bgColor, iconColor, badgeColor }))
        .filter((v, i, a) => a.findIndex(t => t.title === v.title) === i)
        .map(({ title, icon: Icon, bgColor, iconColor, badgeColor }) => {
          const columnMatches = groupedMatches[title] || [];
          if (columnMatches.length === 0) return null;

          return (
            <div key={title} className={`card p-4 ${bgColor}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg bg-card ${iconColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-sm">{title}</h3>
                </div>
                <Badge className={badgeColor}>
                  {columnMatches.length}
                </Badge>
              </div>
              <div className="space-y-2.5">
                {columnMatches.map((match) => (
                  <MatchCard key={match.match_id} match={match} />
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

  const fetchKanbanMatches = useCallback(async (p_profile_id: string) => {
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
      toast({
        title: "Oops! Something went wrong",
        description: "We couldn't load the matches. Please try again.",
        variant: "destructive"
      });
      console.error("Error fetching Kanban matches:", error);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (profileId) {
      fetchKanbanMatches(profileId);
    }
  }, [profileId, fetchKanbanMatches]);

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

      toast({
        title: "✨ Match updated!",
        description: "The match status has been successfully updated.",
        duration: 2000,
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: "We couldn't update the match status. Please try again.",
        variant: "destructive"
      });
      console.error("Error updating match status:", error);
    }
  };

  const activeMatch = matches.find(m => m.match_id === activeId);

  const totalMatches = matches.length;
  const mutualMatches = matches.filter(m => m.match_status === 'both_accepted').length;

  return (
    <>
      <ProfileLibraryModal
        open={isLibraryOpen}
        onOpenChange={setIsLibraryOpen}
        sourceProfileId={profileId!}
        onSuggestSuccess={() => fetchKanbanMatches(profileId!)}
      />
      <div className="min-h-screen bg-background">
        <div className="container-app py-6 md:py-8">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-4 btn-ghost -ml-2"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>

            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1>Match Board</h1>
                  {totalMatches > 0 && (
                    <Badge className="badge-neutral">
                      {totalMatches} total
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  {isMobile ? (
                    "Tap cards to view details"
                  ) : (
                    <>
                      <GripVertical className="w-4 h-4" />
                      Drag and drop cards to update match status
                    </>
                  )}
                </p>
                {mutualMatches > 0 && (
                  <p className="text-xs text-success font-medium mt-1 flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 fill-current" />
                    {mutualMatches} mutual {mutualMatches === 1 ? 'match' : 'matches'}!
                  </p>
                )}
              </div>

              <Button
                size="lg"
                onClick={() => setIsLibraryOpen(true)}
                className="w-full sm:w-auto btn-accent"
              >
                <Plus className="w-5 h-5 mr-2" />
                Suggest More Matches
              </Button>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
              <div className="loading-spinner-lg text-accent"></div>
              <p className="text-sm text-muted-foreground font-medium animate-pulse">Loading matches...</p>
            </div>
          ) : matches.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="rounded-full bg-accent-soft p-6 mb-4">
                  <Sparkles className="w-12 h-12 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No matches yet</h3>
                <p className="text-muted-foreground mb-6 text-center max-w-md">
                  Start suggesting matches to help find the perfect connections!
                </p>
                <Button
                  size="lg"
                  onClick={() => setIsLibraryOpen(true)}
                  className="btn-accent"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Suggest First Match
                </Button>
              </CardContent>
            </Card>
            ) : isMobile ? (
              <MobileListView matches={matches} />
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
                {Object.entries(KANBAN_COLUMNS)
                  .map(([key, { title, icon: Icon, bgColor, iconColor, badgeColor }]) =>
                    ({ key, title, icon: Icon, bgColor, iconColor, badgeColor }))
                  .filter((v, i, a) => a.findIndex(t => t.title === v.title) === i)
                  .map(({ key, title, icon: Icon, bgColor, iconColor, badgeColor }) => {
                    const columnMatches = groupedMatches[title] || [];
                    return (
                      <div
                        key={title}
                        className={`
                          card
                          ${bgColor}
                          flex flex-col
                          overflow-hidden
                        `}
                      >
                        {/* Column Header */}
                        <div className="px-4 py-3.5 flex items-center justify-between bg-card border-b">
                          <div className="flex items-center gap-2.5">
                            <div className={`p-1.5 rounded-lg ${bgColor} ${iconColor}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <h2 className="font-semibold text-sm">{title}</h2>
                          </div>
                          <Badge className={badgeColor}>
                            {columnMatches.length}
                          </Badge>
                        </div>

                        {/* Column Content */}
                        <SortableContext
                          items={columnMatches.map(m => m.match_id)}
                          strategy={verticalListSortingStrategy}
                          id={title}
                        >
                          <div className="p-3 space-y-2.5 overflow-y-auto flex-1 min-h-[180px] max-h-[calc(100vh-320px)]">
                            {columnMatches.map((match) => (
                              <MatchCard key={match.match_id} match={match} />
                            ))}
                            {columnMatches.length === 0 && (
                              <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3 opacity-50">
                                  <Icon className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <p className="text-xs text-muted-foreground font-medium">No matches here yet</p>
                              </div>
                            )}
                          </div>
                        </SortableContext>
                      </div>
                    );
                  })}
              </div>
                <DragOverlay>
                  {activeMatch ? (
                    <div className="rotate-3 scale-105">
                      <MatchCard match={activeMatch} isDragging />
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}
          </div>
        </div>
    </>
  );
};

export default UserMatchKanbanPage;
