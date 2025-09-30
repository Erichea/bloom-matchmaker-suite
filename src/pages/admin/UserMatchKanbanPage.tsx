import { useEffect, useState } from "react";
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
    gradient: "from-blue-50 to-indigo-50",
    border: "border-blue-200/60",
    iconColor: "text-blue-600",
    badgeColor: "bg-blue-100 text-blue-700 border-blue-200"
  },
  profile_1_accepted: {
    title: "Pending",
    icon: CheckCircle,
    key: "profile_1_accepted",
    gradient: "from-amber-50 to-yellow-50",
    border: "border-amber-200/60",
    iconColor: "text-amber-600",
    badgeColor: "bg-amber-100 text-amber-700 border-amber-200"
  },
  profile_2_accepted: {
    title: "Pending",
    icon: CheckCircle,
    key: "profile_2_accepted",
    gradient: "from-amber-50 to-yellow-50",
    border: "border-amber-200/60",
    iconColor: "text-amber-600",
    badgeColor: "bg-amber-100 text-amber-700 border-amber-200"
  },
  both_accepted: {
    title: "Mutual Match",
    icon: Heart,
    key: "both_accepted",
    gradient: "from-emerald-50 to-green-50",
    border: "border-emerald-200/60",
    iconColor: "text-emerald-600",
    badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-200"
  },
  profile_1_rejected: {
    title: "Rejected",
    icon: XCircle,
    key: "profile_1_rejected",
    gradient: "from-rose-50 to-red-50",
    border: "border-rose-200/60",
    iconColor: "text-rose-600",
    badgeColor: "bg-rose-100 text-rose-700 border-rose-200"
  },
  profile_2_rejected: {
    title: "Rejected",
    icon: XCircle,
    key: "profile_2_rejected",
    gradient: "from-rose-50 to-red-50",
    border: "border-rose-200/60",
    iconColor: "text-rose-600",
    badgeColor: "bg-rose-100 text-rose-700 border-rose-200"
  },
  rejected: {
    title: "Rejected",
    icon: XCircle,
    key: "rejected",
    gradient: "from-rose-50 to-red-50",
    border: "border-rose-200/60",
    iconColor: "text-rose-600",
    badgeColor: "bg-rose-100 text-rose-700 border-rose-200"
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
    if (score >= 80) return "bg-gradient-to-r from-emerald-500 to-green-500 text-white";
    if (score >= 60) return "bg-gradient-to-r from-blue-500 to-indigo-500 text-white";
    if (score >= 40) return "bg-gradient-to-r from-amber-500 to-orange-500 text-white";
    return "bg-gradient-to-r from-gray-400 to-gray-500 text-white";
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className={`
        bg-white/90 backdrop-blur-sm
        shadow-sm hover:shadow-lg
        transition-all duration-300 ease-out
        border border-gray-200/60
        hover:border-gray-300
        group
        hover:scale-[1.02]
        active:scale-[0.98]
        ${isDragging ? 'rotate-3 shadow-2xl' : ''}
      `}>
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div
              {...listeners}
              className="cursor-grab active:cursor-grabbing touch-none flex-shrink-0 transition-transform hover:scale-110"
            >
              <GripVertical className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
            </div>

            <Avatar className="w-10 h-10 ring-2 ring-gray-100 group-hover:ring-gray-200 transition-all">
              <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate text-sm leading-tight">
                {name}
              </p>
              <p className="text-xs text-gray-500 truncate leading-tight mt-0.5">
                {age} • {profile.city}
              </p>
            </div>

            <div className={`
              ${getScoreColor(match.compatibility_score)}
              px-2.5 py-1 rounded-full text-xs font-bold
              shadow-sm flex-shrink-0
              transition-all duration-300
              group-hover:scale-110
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
        .map(([key, { title, icon: Icon, gradient, border, iconColor, badgeColor }]) =>
          ({ key, title, icon: Icon, gradient, border, iconColor, badgeColor }))
        .filter((v, i, a) => a.findIndex(t => t.title === v.title) === i)
        .map(({ title, icon: Icon, gradient, border, iconColor, badgeColor }) => {
          const columnMatches = groupedMatches[title] || [];
          if (columnMatches.length === 0) return null;

          return (
            <div key={title} className={`rounded-2xl border-2 ${border} bg-gradient-to-br ${gradient} p-4 shadow-sm`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg bg-white/80 ${iconColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
                </div>
                <Badge className={`${badgeColor} font-bold`}>
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
      toast({
        title: "Oops! Something went wrong",
        description: "We couldn't load the matches. Please try again.",
        variant: "destructive"
      });
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="px-4 py-6 md:px-8 md:py-8 lg:px-12 lg:py-10">
          <div className="max-w-[1800px] mx-auto">
            {/* Header */}
            <div className="mb-8">
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="mb-4 text-gray-600 hover:text-gray-900 hover:bg-gray-100 -ml-2 transition-all duration-200"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>

              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                      Match Board
                    </h1>
                    {totalMatches > 0 && (
                      <Badge className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 px-3 py-1 text-sm font-bold shadow-sm">
                        {totalMatches} total
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    {isMobile ? (
                      "Tap cards to view details"
                    ) : (
                      <>
                        <GripVertical className="w-4 h-4 text-gray-400" />
                        Drag and drop cards to update match status
                      </>
                    )}
                  </p>
                  {mutualMatches > 0 && (
                    <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 fill-current" />
                      {mutualMatches} mutual {mutualMatches === 1 ? 'match' : 'matches'}!
                    </p>
                  )}
                </div>

                <Button
                  size="lg"
                  onClick={() => setIsLibraryOpen(true)}
                  className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Suggest More Matches
                </Button>
              </div>
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex flex-col items-center justify-center h-96 gap-4">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent absolute top-0 left-0"></div>
                </div>
                <p className="text-sm text-gray-500 font-medium animate-pulse">Loading matches...</p>
              </div>
            ) : matches.length === 0 ? (
              <Card className="border-2 border-dashed border-gray-300 bg-gray-50/50">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 p-6 mb-4">
                    <Sparkles className="w-12 h-12 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No matches yet</h3>
                  <p className="text-gray-600 mb-6 text-center max-w-md">
                    Start suggesting matches to help find the perfect connections!
                  </p>
                  <Button
                    size="lg"
                    onClick={() => setIsLibraryOpen(true)}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
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
                    .map(([key, { title, icon: Icon, gradient, border, iconColor, badgeColor }]) =>
                      ({ key, title, icon: Icon, gradient, border, iconColor, badgeColor }))
                    .filter((v, i, a) => a.findIndex(t => t.title === v.title) === i)
                    .map(({ key, title, icon: Icon, gradient, border, iconColor, badgeColor }) => {
                      const columnMatches = groupedMatches[title] || [];
                      return (
                        <div
                          key={title}
                          className={`
                            rounded-2xl border-2 ${border}
                            bg-gradient-to-br ${gradient}
                            shadow-sm hover:shadow-md
                            transition-all duration-300
                            flex flex-col
                            overflow-hidden
                          `}
                        >
                          {/* Column Header */}
                          <div className="px-4 py-3.5 flex items-center justify-between bg-white/80 backdrop-blur-sm border-b border-gray-200/60">
                            <div className="flex items-center gap-2.5">
                              <div className={`p-1.5 rounded-lg bg-gradient-to-br ${gradient} ${iconColor}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <h2 className="font-bold text-gray-900 text-sm tracking-tight">{title}</h2>
                            </div>
                            <Badge className={`${badgeColor} font-bold shadow-sm`}>
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
                                  <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center mb-3 opacity-50">
                                    <Icon className="w-6 h-6 text-gray-400" />
                                  </div>
                                  <p className="text-xs text-gray-500 font-medium">No matches here yet</p>
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
      </div>
    </>
  );
};

export default UserMatchKanbanPage;