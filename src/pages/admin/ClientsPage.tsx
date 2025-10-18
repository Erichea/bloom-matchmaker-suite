import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";
import { format, isSameMonth } from "date-fns";
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  Undo2,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Loader2,
  CheckCircle,
  Clock,
  Check,
  X,
  Bell,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { getProfileQuestions, getPreferenceQuestions, formatAnswer as formatQuestionnaireAnswer } from "@/config/questionnaireConfig";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import ClientNotesEditor from "@/components/admin/ClientNotesEditor";
import MatchDetailsModal from "@/components/admin/MatchDetailsModal";
import SuggestMatchesModal from "@/components/admin/SuggestMatchesModal";
import { calculateBidirectionalCompatibility, type ProfileAnswers } from "@/utils/compatibilityCalculator";

interface ProfilePhoto {
  photo_url: string | null;
  is_primary: boolean | null;
  order_index?: number | null;
}

interface ClientRow {
  id: string;
  user_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  city: string | null;
  country: string | null;
  status: string;
  completion_percentage: number | null;
  created_at: string;
  submitted_for_review_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
  status_before_deletion: string | null;
  profile_photos?: ProfilePhoto[] | null;
}

interface DetailedProfile extends ClientRow {
  phone: string | null;
  date_of_birth: string | null;
  profession: string | null;
  about_me: string | null;
  admin_notes: string | null;
  rejection_reason: string | null;
  interests: string[] | null;
  lifestyle: string[] | null;
  updated_at: string;
}

type ViewMode = "active" | "deleted";

type QuestionnaireAnswers = Record<string, any>;

interface QuestionnaireQuestion {
  id: string;
  version: number;
  question_order: number;
  question_type: string;
  question_text_en: string;
  question_text_fr: string | null;
  subtitle_en: string | null;
  subtitle_fr: string | null;
  help_text_en: string | null;
  help_text_fr: string | null;
  icon_name: string | null;
  options: any;
  validation_rules: any;
  is_required: boolean;
  conditional_on: string | null;
  conditional_value: string | null;
  profile_field_mapping: string | null;
}

type StatusFilter = "all" | "pending_approval" | "approved" | "rejected" | "incomplete";

interface MatchSummaryProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  city: string | null;
  country: string | null;
  profession: string | null;
  date_of_birth: string | null;
}

interface MatchSummary {
  match_id: string;
  match_status: string | null;
  compatibility_score: number | null;
  other_profile: MatchSummaryProfile | null;
}

type MatchStatusVariant = "default" | "secondary" | "destructive" | "outline";

const MATCH_STATUS_META: Record<string, { label: string; variant: MatchStatusVariant }> = {
  pending: { label: "Awaiting responses", variant: "secondary" },
  profile_1_accepted: { label: "Accepted by client", variant: "default" },
  profile_2_accepted: { label: "Accepted by match", variant: "default" },
  both_accepted: { label: "Mutual match", variant: "default" },
  profile_1_rejected: { label: "Declined by client", variant: "destructive" },
  profile_2_rejected: { label: "Declined by match", variant: "destructive" },
  rejected: { label: "Rejected", variant: "destructive" },
};

const getMatchStatusMeta = (status?: string | null) => {
  if (!status) {
    return { label: "Status unknown", variant: "outline" as MatchStatusVariant };
  }
  return MATCH_STATUS_META[status] ?? { label: "Status unknown", variant: "outline" };
};

const formatMatchName = (profile?: MatchSummaryProfile | null) => {
  if (!profile) return "Unnamed profile";
  const parts = [] as string[];
  if (profile.first_name) parts.push(profile.first_name);
  if (profile.last_name) parts.push(profile.last_name);
  if (parts.length === 0 && profile.email) return profile.email;
  return parts.join(" ") || "Unnamed profile";
};

const formatMatchLocation = (profile?: MatchSummaryProfile | null) => {
  if (!profile) return "";
  return [profile.city, profile.country].filter(Boolean).join(", ");
};

const STATUS_FILTER_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "pending_approval", label: "Pending review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "incomplete", label: "Incomplete" },
];

const formatDate = (value: string | null | undefined, includeTime = false) => {
  if (!value) return "—";
  try {
    const parsed = new Date(value);
    return includeTime ? format(parsed, "MMM d, yyyy • h:mm a") : format(parsed, "MMM d, yyyy");
  } catch (error) {
    return "—";
  }
};

const formatAnswer = (answer: any): string => {
  if (answer === null || answer === undefined || answer === "") {
    return "Not answered";
  }
  if (Array.isArray(answer)) {
    return answer.length ? answer.join(", ") : "Not answered";
  }
  if (typeof answer === "object") {
    return JSON.stringify(answer, null, 2);
  }
  return String(answer);
};

const getPrimaryPhoto = (photos?: ProfilePhoto[] | null) => {
  if (!photos?.length) return null;
  const sorted = [...photos].sort((a, b) => (a.is_primary === b.is_primary ? 0 : a.is_primary ? -1 : 1));
  return sorted[0]?.photo_url ?? null;
};

const ClientsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const userId = user?.id ?? null;
  const [searchParams, setSearchParams] = useSearchParams();

  const [view, setView] = useState<ViewMode>("active");
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [cockpitOpen, setCockpitOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<DetailedProfile | null>(null);
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState<QuestionnaireAnswers>({});
  const [questionnaireQuestions, setQuestionnaireQuestions] = useState<QuestionnaireQuestion[]>([]);
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesError, setMatchesError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState("profile");

  const [matchDetailsOpen, setMatchDetailsOpen] = useState(false);
  const [selectedMatchForDetails, setSelectedMatchForDetails] = useState<MatchSummary | null>(null);
  const [selectedMatchAnswers, setSelectedMatchAnswers] = useState<ProfileAnswers>({});
  const [suggestMatchesOpen, setSuggestMatchesOpen] = useState(false);
  const [matchSuggestions, setMatchSuggestions] = useState<MatchSummary[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [sendingTestNotification, setSendingTestNotification] = useState(false);
  const [deleteMatchDialogOpen, setDeleteMatchDialogOpen] = useState(false);
  const [deletingMatchId, setDeletingMatchId] = useState<string | null>(null);

  const updateStatusFilter = useCallback((value: StatusFilter) => {
    setStatusFilter(value);
    setColumnFilters((previous) => {
      const withoutStatus = previous.filter((filter) => filter.id !== "status");
      return value === "all"
        ? withoutStatus
        : [...withoutStatus, { id: "status", value }];
    });
  }, [setColumnFilters]);

  const fetchClients = useCallback(
    async (currentView: ViewMode) => {
      try {
        setLoading(true);
        let query = supabase
          .from("profiles")
          .select(
            `
              id,
              user_id,
              first_name,
              last_name,
              email,
              city,
              country,
              status,
              completion_percentage,
              created_at,
              submitted_for_review_at,
              approved_at,
              rejected_at,
              deleted_at,
              deleted_by,
              status_before_deletion,
              profile_photos ( photo_url, is_primary, order_index )
            `,
          );

        // Filter based on view
        if (currentView === "active") {
          query = query.is("deleted_at", null);
        } else {
          query = query.not("deleted_at", "is", null);
        }

        query = query.order("created_at", { ascending: false });

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        setClients((data as any[]) || []);
      } catch (error: any) {
        console.error("Failed to fetch clients", error);
        toast({
          title: "Unable to load clients",
          description: error.message || "Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  const loadMatches = useCallback(async (profileId: string) => {
    try {
      setMatchesLoading(true);
      setMatchesError(null);

      const { data, error } = await supabase.rpc("get_matches_for_kanban" as any, {
        p_profile_id: profileId,
      });

      if (error) {
        throw error;
      }

      console.debug("Matches RPC result", { profileId, data });

      const matchList: MatchSummary[] = (data as any[] | null)?.map((match) => ({
        match_id: match.match_id,
        match_status: match.match_status ?? null,
        compatibility_score: match.compatibility_score ?? null,
        other_profile: match.other_profile ?? null,
      })) ?? [];

      console.debug("Transformed matches", matchList);
      setMatches(matchList);
    } catch (error: any) {
      console.error("Failed to load matches", error);
      setMatches([]);
      setMatchesError(error.message || "Unable to load matches.");
    } finally {
      setMatchesLoading(false);
    }
  }, []);

  const loadMatchSuggestions = useCallback(async (profileId: string, clientAnswers: ProfileAnswers) => {
    try {
      setSuggestionsLoading(true);

      // Get available profiles for suggestion
      const { data: profiles, error: profilesError } = await supabase.rpc(
        "get_profiles_for_suggestion",
        { p_profile_id: profileId }
      );

      if (profilesError) throw profilesError;

      // Filter out already suggested profiles and limit to top suggestions
      const availableProfiles = (profiles || []).filter((p: any) => !p.is_already_suggested).slice(0, 10);

      // Get user_ids for fetching answers
      const { data: profileData, error: profileDataError } = await supabase
        .from("profiles")
        .select("id, user_id")
        .in("id", availableProfiles.map((p: any) => p.id));

      if (profileDataError) throw profileDataError;

      const userIdMap = (profileData || []).reduce((acc: Record<string, string>, p: any) => {
        acc[p.id] = p.user_id;
        return acc;
      }, {});

      // Get all profile answers for available profiles to calculate compatibility
      const userIds = Object.values(userIdMap);
      const { data: answersData, error: answersError } = await supabase
        .from("profile_answers")
        .select("user_id, question_id, answer")
        .in("user_id", userIds);

      if (answersError) throw answersError;

      // Group answers by user_id
      const answersByUser = (answersData || []).reduce((acc: Record<string, ProfileAnswers>, row: any) => {
        if (!acc[row.user_id]) acc[row.user_id] = {};
        acc[row.user_id][row.question_id] = row.answer;
        return acc;
      }, {});

      // Calculate compatibility for each suggestion
      const suggestions: MatchSummary[] = availableProfiles.map((profile: any) => {
        const userId = userIdMap[profile.id];
        const matchAnswers = answersByUser[userId] || {};

        // Calculate compatibility using the existing function
        const compatibility = calculateBidirectionalCompatibility(clientAnswers, matchAnswers);

        return {
          match_id: `suggestion_${profile.id}`,
          match_status: null,
          compatibility_score: compatibility.average,
          other_profile: {
            id: profile.id,
            first_name: profile.first_name,
            last_name: profile.last_name,
            email: profile.email,
            city: profile.city,
            country: profile.country,
            profession: profile.profession,
            date_of_birth: profile.date_of_birth,
          },
        };
      });

      // Sort by compatibility score descending
      suggestions.sort((a, b) => (b.compatibility_score || 0) - (a.compatibility_score || 0));

      setMatchSuggestions(suggestions);
    } catch (error: any) {
      console.error("Failed to load match suggestions", error);
      setMatchSuggestions([]);
    } finally {
      setSuggestionsLoading(false);
    }
  }, []);

  const loadClientDetails = useCallback(
    async (profileId: string) => {
      try {
        setDetailLoading(true);
        setSelectedProfile(null);
        setQuestionnaireAnswers({});
        setQuestionnaireQuestions([]);
        setMatches([]);
        setMatchesError(null);

        // Fetch questionnaire questions
        const { data: questionsData, error: questionsError } = await supabase
          .from("questionnaire_questions")
          .select("*")
          .eq("version", 1)
          .order("question_order");

        if (questionsError) {
          console.error("Failed to load questionnaire questions", questionsError);
        } else {
          setQuestionnaireQuestions(questionsData || []);
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select(
            `
              *,
              profile_photos ( photo_url, is_primary, order_index )
            `,
          )
          .eq("id", profileId)
          .single();

        if (error) {
          throw error;
        }

        const detailedProfile = profile as any;

        const { data: photosData, error: photosError } = await supabase
          .from("profile_photos")
          .select("photo_url, is_primary, order_index")
          .eq("profile_id", profileId)
          .order("is_primary", { ascending: false, nullsFirst: false })
          .order("order_index", { ascending: true, nullsFirst: true });

        if (!photosError) {
          console.debug("Profile photos fetched", photosData);
          detailedProfile.profile_photos = photosData || [];
        } else {
          console.error("Failed to load profile photos", photosError);
        }

        let answersMap: QuestionnaireAnswers = {};
        if (detailedProfile?.user_id) {
          const { data: answersData, error: answersError } = await supabase
            .from("profile_answers")
            .select("question_id, answer")
            .eq("user_id", detailedProfile.user_id);

          if (answersError) {
            throw answersError;
          }

          answersMap = (answersData || []).reduce<QuestionnaireAnswers>((acc, curr) => {
            acc[curr.question_id] = curr.answer;
            return acc;
          }, {});

          setQuestionnaireAnswers(answersMap);
        }

        console.debug("Detailed profile loaded", detailedProfile);
        setSelectedProfile(detailedProfile);
        loadMatches(profileId);
        loadMatchSuggestions(profileId, answersMap);

        // Track profile view for recently viewed list
        try {
          const { error: trackError } = await supabase.rpc("track_profile_view", { p_profile_id: profileId });
          if (trackError) {
            console.error("Failed to track profile view:", trackError);
          } else {
            console.debug("Profile view tracked successfully for:", profileId);
          }
        } catch (trackingError) {
          console.error("Error tracking profile view:", trackingError);
        }
      } catch (error: any) {
        console.error("Failed to load profile", error);
        toast({
          title: "Unable to load profile",
          description: error.message || "Please try again later.",
          variant: "destructive",
        });
        setCockpitOpen(false);
      } finally {
        setDetailLoading(false);
      }
    },
    [toast, loadMatches, loadMatchSuggestions],
  );

  useEffect(() => {
    fetchClients(view);
  }, [fetchClients, view]);

  // Auto-open profile from URL parameter
  useEffect(() => {
    const profileId = searchParams.get('profileId');
    if (profileId && !cockpitOpen) {
      setSelectedClientId(profileId);
      setCockpitOpen(true);
      // Clear the parameter after opening
      setSearchParams({});
    }
  }, [searchParams, cockpitOpen, setSearchParams]);

  useEffect(() => {
    updateStatusFilter("all");
    setGlobalFilter("");
  }, [view, updateStatusFilter]);

  useEffect(() => {
    if (cockpitOpen && selectedClientId) {
      loadClientDetails(selectedClientId);
    }
  }, [cockpitOpen, selectedClientId, loadClientDetails]);

  useEffect(() => {
    if (selectedClientId) {
      setDetailTab("profile");
    }
  }, [selectedClientId]);

  const handleCloseDetail = useCallback(() => {
    setCockpitOpen(false);
    setSelectedClientId(null);
    setSelectedProfile(null);
    setQuestionnaireAnswers({});
    setQuestionnaireQuestions([]);
    setMatches([]);
    setMatchesError(null);
    setMatchesLoading(false);
    setDetailTab("profile");
  }, [setDetailTab]);

  useEffect(() => {
    if (!cockpitOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleCloseDetail();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cockpitOpen, handleCloseDetail]);

  const handleRowClick = (client: ClientRow) => {
    setSelectedClientId(client.id);
    setCockpitOpen(true);
  };

  const refreshData = useCallback(
    async (targetProfileId?: string | null) => {
      await fetchClients(view);
      const profileId = targetProfileId ?? selectedClientId;
      if (profileId) {
        await loadClientDetails(profileId);
      }
    },
    [fetchClients, view, selectedClientId, loadClientDetails],
  );

  const handleApprove = useCallback(
    async (profileId?: string) => {
      const targetProfileId = profileId ?? selectedClientId;
      if (!userId || !targetProfileId) return;

      try {
        const { data, error } = await supabase.rpc("approve_profile", {
          p_profile_id: targetProfileId,
          p_admin_id: userId,
        });

        if (error) throw error;

        if ((data as any)?.success) {
          toast({ title: "Profile approved" });
          await refreshData();
        } else {
          throw new Error((data as any)?.message || "Failed to approve profile");
        }
      } catch (error: any) {
        toast({
          title: "Approval failed",
          description: error.message || "Please try again.",
          variant: "destructive",
        });
      }
    },
    [selectedClientId, toast, refreshData, userId],
  );

  const handleReject = useCallback(async () => {
    if (!userId || !selectedClientId) return;
    if (!rejectionReason.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.rpc("reject_profile", {
        p_profile_id: selectedClientId,
        p_admin_id: userId,
        p_rejection_reason: rejectionReason.trim(),
      });

      if (error) throw error;

      if ((data as any)?.success) {
        toast({ title: "Profile rejected" });
        setRejectDialogOpen(false);
        setRejectionReason("");
        await refreshData();
      } else {
        throw new Error((data as any)?.message || "Failed to reject profile");
      }
    } catch (error: any) {
      toast({
        title: "Rejection failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  }, [userId, selectedClientId, rejectionReason, toast, refreshData]);

  const handleDelete = async () => {
    if (!userId || !selectedClientId) return;

    try {
      const { data, error } = await supabase.rpc("soft_delete_profile" as any, {
        p_profile_id: selectedClientId,
        p_admin_id: userId,
      });

      if (error) throw error;

      if ((data as any)?.success) {
        toast({ title: "Profile deleted" });
        setDeleteDialogOpen(false);
        setCockpitOpen(false);
        setSelectedClientId(null);
        await fetchClients(view);
      } else {
        throw new Error((data as any)?.message || "Failed to delete profile");
      }
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRestore = async () => {
    if (!userId || !selectedClientId) return;

    try {
      const { data, error } = await supabase.rpc("restore_profile" as any, {
        p_profile_id: selectedClientId,
        p_admin_id: userId,
      });

      if (error) throw error;

      if ((data as any)?.success) {
        toast({ title: "Profile restored" });
        setRestoreDialogOpen(false);
        setCockpitOpen(false);
        setSelectedClientId(null);
        await fetchClients(view);
      } else {
        throw new Error((data as any)?.message || "Failed to restore profile");
      }
    } catch (error: any) {
      toast({
        title: "Restore failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSendTestNotification = async () => {
    if (!selectedProfile?.user_id) {
      toast({
        title: "Error",
        description: "No user ID found for this client",
        variant: "destructive",
      });
      return;
    }

    setSendingTestNotification(true);
    try {
      const { data, error } = await supabase.functions.invoke("notify", {
        body: {
          action: "send",
          userId: selectedProfile.user_id,
          web_push: {
            title: "Test Notification 🔔",
            message: `Hi ${selectedProfile.first_name || "there"}! This is a test notification from Bloom Matchmaker.`,
            icon: window.location.origin + "/icon-192.png",
            url: window.location.origin + "/client/dashboard"
          },
          channels: ["push"]
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Test notification sent",
        description: "Check the user's device for the notification",
      });
    } catch (error: any) {
      console.error("Test notification error:", error);
      toast({
        title: "Failed to send test notification",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setSendingTestNotification(false);
    }
  };

  const handleDeleteMatch = async () => {
    if (!deletingMatchId) return;

    try {
      const { data, error } = await supabase.rpc('delete_match', {
        p_match_id: deletingMatchId
      });

      if (error) throw error;

      const result = data as { success: boolean; message?: string; notifications_deleted?: number; interactions_deleted?: number };

      if (result?.success) {
        toast({
          title: "Match deleted",
          description: `Match and ${result.notifications_deleted || 0} notification(s) have been removed`,
        });

        // Refresh matches
        if (selectedProfile) {
          await loadMatches(selectedProfile.id);
          await loadMatchSuggestions(selectedProfile.id, questionnaireAnswers);
        }

        // Close dialogs
        setDeleteMatchDialogOpen(false);
        setDeletingMatchId(null);
      } else {
        throw new Error(result?.message || 'Failed to delete match');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete match",
        variant: "destructive"
      });
    }
  };

  const confirmDeleteMatch = (matchId: string) => {
    setDeletingMatchId(matchId);
    setDeleteMatchDialogOpen(true);
  };

  const stats = useMemo(() => {
    const cards: Array<{
      label: string;
      value: number;
      icon: ComponentType<any>;
      tone: string;
      statusValue?: StatusFilter;
    }> = [];

    if (view === "active") {
      const total = clients.length;
      const pending = clients.filter((client) => client.status === "pending_approval").length;
      const approved = clients.filter((client) => client.status === "approved").length;
      const thisMonth = clients.filter((client) =>
        client.created_at ? isSameMonth(new Date(client.created_at), new Date()) : false,
      ).length;

      cards.push(
        { label: "Total clients", value: total, icon: Users, tone: "text-primary", statusValue: "all" },
        { label: "Pending review", value: pending, icon: Clock, tone: "text-warning", statusValue: "pending_approval" },
        { label: "Approved", value: approved, icon: ShieldCheck, tone: "text-success", statusValue: "approved" },
        { label: "Joined this month", value: thisMonth, icon: Calendar, tone: "text-muted-foreground" },
      );
    } else {
      const totalDeleted = clients.length;
      const deletedThisMonth = clients.filter((client) =>
        client.deleted_at ? isSameMonth(new Date(client.deleted_at), new Date()) : false,
      ).length;

      cards.push(
        { label: "Deleted profiles", value: totalDeleted, icon: Trash2, tone: "text-destructive" },
        { label: "Deleted this month", value: deletedThisMonth, icon: Calendar, tone: "text-muted-foreground" },
        { label: "Restorable", value: totalDeleted, icon: Undo2, tone: "text-primary" },
        { label: "Previously approved", value: clients.filter((c) => c.status_before_deletion === "approved").length, icon: ShieldAlert, tone: "text-warning" },
      );
    }

    return cards;
  }, [clients, view]);

  const columns = useMemo<ColumnDef<ClientRow>[]>(
    () => [
      {
        accessorKey: "first_name",
        header: "Client",
        cell: ({ row }) => {
          const client = row.original;
          const fullName = `${client.first_name ?? ""} ${client.last_name ?? ""}`.trim() || "Unnamed";
          const initials = fullName
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
          const photo = getPrimaryPhoto(client.profile_photos);

          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                {photo ? <AvatarImage src={photo} alt={fullName} /> : <AvatarFallback>{initials || "?"}</AvatarFallback>}
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium text-sm text-foreground">{fullName}</span>
                <span className="text-xs text-muted-foreground">{client.email || "No email"}</span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const client = row.original;
          if (client.deleted_at) {
            return <Badge variant="outline" className="text-xs">Deleted</Badge>;
          }

          switch (client.status) {
            case "approved":
              return <Badge className="badge-success">Approved</Badge>;
            case "pending_approval":
              return <Badge className="badge-warning">Pending review</Badge>;
            case "rejected":
              return <Badge className="badge-error">Rejected</Badge>;
            default:
              return <Badge variant="secondary">Incomplete</Badge>;
          }
        },
      },
      {
        accessorKey: "completion_percentage",
        header: "Completion",
        cell: ({ row }) => {
          const value = row.original.completion_percentage ?? 0;
          return <span className="text-sm font-medium">{value}%</span>;
        },
      },
      {
        accessorKey: "city",
        header: "Location",
        cell: ({ row }) => {
          const client = row.original;
          const location = [client.city, client.country].filter(Boolean).join(", ");
          return <span className="text-sm text-muted-foreground">{location || "—"}</span>;
        },
      },
      {
        accessorKey: "created_at",
        header: view === "active" ? "Created" : "Deleted",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {view === "active" ? formatDate(row.original.created_at) : formatDate(row.original.deleted_at, true)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const client = row.original;

          if (view === "deleted" || client.deleted_at || client.status !== "pending_approval") {
            return <div className="h-8" />;
          }

          return (
            <div className="flex justify-end gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 border border-border text-success hover:text-success"
                onClick={(event) => {
                  event.stopPropagation();
                  handleApprove(client.id);
                }}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 border border-border text-destructive hover:text-destructive"
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedClientId(client.id);
                  setRejectionReason("");
                  setRejectDialogOpen(true);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [view, handleApprove],
  );

  const table = useReactTable({
    data: clients,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const selectedClient = selectedProfile;
  const currentFullName = selectedClient
    ? `${selectedClient.first_name ?? ""} ${selectedClient.last_name ?? ""}`.trim() || "Unnamed"
    : "";
  const currentPrimaryPhoto = getPrimaryPhoto(selectedClient?.profile_photos ?? []);
  const sortedProfilePhotos = useMemo(() => {
    if (!selectedClient?.profile_photos?.length) return [] as ProfilePhoto[];

    return selectedClient.profile_photos
      .filter((photo): photo is ProfilePhoto => Boolean(photo?.photo_url))
      .slice()
      .sort((a, b) => {
        const primaryRankA = a.is_primary ? 0 : 1;
        const primaryRankB = b.is_primary ? 0 : 1;
        if (primaryRankA !== primaryRankB) return primaryRankA - primaryRankB;

        const orderA = a.order_index ?? 0;
        const orderB = b.order_index ?? 0;
        return orderA - orderB;
      });
  }, [selectedClient?.profile_photos]);
  const completionPercentage = selectedProfile?.completion_percentage ?? 0;
  const statusLabel = selectedProfile
    ? selectedProfile.status === "pending_approval"
      ? "Pending review"
      : selectedProfile.status.replace("_", " ")
    : "";
  const statusBadgeClass = selectedProfile
    ? selectedProfile.status === "approved"
      ? "badge-success"
      : selectedProfile.status === "pending_approval"
        ? "badge-warning"
        : selectedProfile.status === "rejected"
          ? "badge-error"
          : ""
    : "";
  const renderInfoField = (label: string, value: string | number | null | undefined) => (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">
        {value === null || value === undefined || value === "" ? "Not provided" : value}
      </span>
    </div>
  );

  const reduceNodeToText = useCallback((node: any): string => {
    if (!node) return "";
    if (node.type === "text") {
      return node.text || "";
    }

    if (Array.isArray(node.content)) {
      return node.content
        .map((child: any) => reduceNodeToText(child))
        .join(
          node.type === "paragraph" ||
            node.type === "doc" ||
            node.type?.includes("heading") ||
            node.type?.includes("list")
            ? "\n"
            : " ",
        );
    }

    return "";
  }, []);

  const adminNotesPreview = useMemo(() => {
    if (!selectedProfile?.admin_notes) return "";
    try {
      const parsed = JSON.parse(selectedProfile.admin_notes);
      if (parsed && typeof parsed === "object") {
        return reduceNodeToText(parsed).trim();
      }
      return selectedProfile.admin_notes;
    } catch (error) {
      return selectedProfile.admin_notes;
    }
  }, [reduceNodeToText, selectedProfile?.admin_notes]);



  const handleCreateMatchFromSuggestion = useCallback(async () => {
    if (!selectedProfile || !selectedMatchForDetails?.other_profile?.id) return;

    try {
      const { data, error } = await supabase.rpc("create_match_from_suggestion" as any, {
        p_profile_id: selectedProfile.id,
        p_match_profile_id: selectedMatchForDetails.other_profile.id,
      });

      if (error) throw error;

      if ((data as any)?.success) {
        toast({
          title: "Match created",
          description: `Successfully created a match between ${selectedProfile.first_name} and ${selectedMatchForDetails.other_profile.first_name}`,
        });
        refreshData(selectedProfile.id);
        setMatchDetailsOpen(false);
        setSelectedMatchForDetails(null);
        setSelectedMatchAnswers({});
      } else {
        throw new Error((data as any)?.message || "Failed to create match");
      }
    } catch (error: any) {
      console.error("Error creating match from suggestion:", error);
      toast({
        title: "Failed to create match",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  }, [selectedProfile, selectedMatchForDetails, toast, refreshData]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container-app py-6 md:py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1>Client Management</h1>
              <p className="text-muted-foreground mt-2">
                Review, approve, delete, and restore client profiles from a single cockpit.
              </p>
            </div>
            <Tabs value={view} onValueChange={(value) => setView(value as ViewMode)} className="w-full sm:w-auto">
              <TabsList>
                <TabsTrigger value="active">Active clients</TabsTrigger>
                <TabsTrigger value="deleted">Deleted clients</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map(({ label, value, icon: Icon, tone, statusValue }) => {
              const isClickable = view === "active" && statusValue !== undefined;
              const isActiveCard = isClickable && statusFilter === statusValue;

              const handleCardInteraction = () => {
                if (!isClickable || !statusValue) return;
                updateStatusFilter(statusValue);
              };

              return (
                <Card
                  key={label}
                  role={isClickable ? "button" : undefined}
                  tabIndex={isClickable ? 0 : undefined}
                  onClick={handleCardInteraction}
                  onKeyDown={(event) => {
                    if (!isClickable) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleCardInteraction();
                    }
                  }}
                  className={`card ${isClickable ? "cursor-pointer transition-colors hover:border-primary/40" : ""} ${isActiveCard ? "border-primary shadow-sm" : ""}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{label}</p>
                        <p className="text-2xl font-semibold">{value}</p>
                      </div>
                      <Icon className={`h-8 w-8 ${tone}`} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative md:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or email"
                value={globalFilter ?? ""}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 gap-3 md:justify-end w-full md:w-auto">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                <Select value={statusFilter} onValueChange={(value) => updateStatusFilter(value as StatusFilter)}>
                  <SelectTrigger className="w-48" disabled={view === "deleted"}>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_FILTER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <span className="text-sm text-muted-foreground">
                Showing {table.getRowModel().rows.length} of {table.getFilteredRowModel().rows.length} profiles
              </span>
            </div>
          </div>

          <Card className="card">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : table.getRowModel().rows.length ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <TableHead key={header.id} className="text-xs uppercase tracking-wide text-muted-foreground">
                              {header.isPlaceholder
                                ? null
                                : flexRender(header.column.columnDef.header, header.getContext())}
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleRowClick(row.original)}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell
                              key={cell.id}
                              className={`py-4 text-sm ${cell.column.id === "actions" ? "text-right" : ""}`}
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-16 flex flex-col items-center gap-2 text-muted-foreground">
                  <Users className="h-10 w-10" />
                  <p className="font-medium">No profiles found</p>
                  <p className="text-sm">Try adjusting your search or filters.</p>
                </div>
              )}

              {table.getRowModel().rows.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t px-6 py-4 text-sm">
                  <span className="text-muted-foreground">
                    Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {cockpitOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold">Client overview</h2>
              <p className="text-sm text-muted-foreground">{currentFullName || "Client profile"}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {selectedProfile?.status === "pending_approval" && (
                <>
                  <Button size="sm" onClick={() => handleApprove()} className="btn-accent">
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setRejectionReason("");
                      setRejectDialogOpen(true);
                    }}
                    className="btn-secondary"
                  >
                    Reject
                  </Button>
                </>
              )}
              {selectedProfile?.deleted_at ? (
                <Button size="sm" className="btn-accent" onClick={() => setRestoreDialogOpen(true)}>
                  <Undo2 className="mr-1 h-4 w-4" /> Restore
                </Button>
              ) : (
                <Button size="sm" variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                  <Trash2 className="mr-1 h-4 w-4" /> Delete
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={handleSendTestNotification}
                disabled={sendingTestNotification || !selectedProfile?.user_id}
              >
                {sendingTestNotification ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Bell className="mr-1 h-4 w-4" />
                )}
                Test Notification
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleCloseDetail}
                aria-label="Close client details"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
            <aside className="w-full border-b bg-muted/20 lg:w-[32%] lg:border-b-0 lg:border-r xl:w-[28%]">
              {detailLoading && !selectedProfile ? (
                <div className="flex h-full items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : selectedProfile ? (
                <ScrollArea className="h-full">
                  <div className="space-y-6 px-6 py-6">
                    <div className="flex flex-col items-center gap-4 text-center">
                      <div className="h-44 w-44 overflow-hidden rounded-xl border border-border bg-muted">
                        {currentPrimaryPhoto ? (
                          <img
                            src={currentPrimaryPhoto}
                            alt={currentFullName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-muted-foreground">
                            {(currentFullName.slice(0, 2) || "?").toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl font-semibold text-foreground">{currentFullName || "Client profile"}</h3>
                        <p className="break-all text-sm text-muted-foreground">
                          {selectedProfile.email || "No email on file"}
                        </p>
                      </div>
                      <div className="flex flex-wrap justify-center gap-2">
                        {statusLabel && <Badge className={`capitalize ${statusBadgeClass}`}>{statusLabel}</Badge>}
                        {selectedProfile.deleted_at && (
                          <Badge variant="outline" className="text-xs uppercase tracking-wide">
                            Deleted
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          <span>Profile completion</span>
                          <span>{completionPercentage}%</span>
                        </div>
                        <Progress value={completionPercentage} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedProfile.email || "No email"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedProfile.phone || "No phone on file"}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                          <span>
                            {[selectedProfile.city, selectedProfile.country].filter(Boolean).join(", ") ||
                              "Location not set"}
                          </span>
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Created {formatDate(selectedProfile.created_at)}</span>
                        </div>
                        {selectedProfile.submitted_for_review_at && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>Submitted {formatDate(selectedProfile.submitted_for_review_at)}</span>
                          </div>
                        )}
                        {selectedProfile.approved_at && (
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4" />
                            <span>Approved {formatDate(selectedProfile.approved_at)}</span>
                          </div>
                        )}
                        {selectedProfile.rejected_at && (
                          <div className="flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4" />
                            <span>Rejected {formatDate(selectedProfile.rejected_at)}</span>
                          </div>
                        )}
                        {selectedProfile.deleted_at && (
                          <div className="flex items-center gap-2">
                            <Trash2 className="h-4 w-4" />
                            <span>Deleted {formatDate(selectedProfile.deleted_at, true)}</span>
                          </div>
                        )}
                      </div>
                      {(selectedProfile.profession || selectedProfile.about_me || selectedProfile.admin_notes) && (
                        <div className="space-y-2">
                          {selectedProfile.profession && (
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Profession
                              </p>
                              <p>{selectedProfile.profession}</p>
                            </div>
                          )}
                          {selectedProfile.about_me && (
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                About
                              </p>
                              <p>{selectedProfile.about_me}</p>
                            </div>
                          )}
                          {adminNotesPreview && (
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Admin notes
                              </p>
                              <p className="whitespace-pre-line text-sm text-muted-foreground">
                                {adminNotesPreview}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex h-full items-center justify-center py-12 text-sm text-muted-foreground">
                  Select a client to view details
                </div>
              )}
            </aside>
            <div className="flex-1 overflow-hidden">
              {detailLoading && !selectedProfile ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : selectedProfile ? (
                <Tabs value={detailTab} onValueChange={setDetailTab} className="flex h-full flex-col">
                  <div className="border-b px-6 py-3 flex-shrink-0">
                    <TabsList>
                      <TabsTrigger value="profile">Profile</TabsTrigger>
                      <TabsTrigger value="matches" className="gap-2">
                        Matches
                        <Badge variant="secondary" className="text-[0.7rem] font-medium">
                          {matchesLoading ? "…" : matches.length}
                        </Badge>
                      </TabsTrigger>
                      <TabsTrigger value="photos" className="gap-2">
                        Photos
                        <Badge variant="secondary" className="text-[0.7rem] font-medium">
                          {sortedProfilePhotos.length}
                        </Badge>
                      </TabsTrigger>
                      <TabsTrigger value="notes">Notes</TabsTrigger>
                    </TabsList>
                  </div>
                  <div className="flex-1 overflow-hidden min-h-0">
                    <TabsContent value="profile" className="m-0 h-full px-6 py-6 overflow-auto">
                      <div className="space-y-4">
                        <Accordion type="multiple" className="space-y-3" defaultValue={["personal", "preferences", "admin"]}>
                          {/* Personal Information Section - Dynamically filtered profile questions */}
                          <AccordionItem value="personal" className="rounded-md border border-border">
                            <AccordionTrigger className="px-4 py-3 text-sm font-semibold">
                              Personal Information
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                              <div className="space-y-4">
                                {getProfileQuestions(questionnaireQuestions).map((question) => {
                                    const answer = questionnaireAnswers[question.id];
                                    return (
                                      <div
                                        key={question.id}
                                        className="rounded-md border border-border p-3 text-sm"
                                      >
                                        <div className="mb-2 flex items-center gap-2 font-medium">
                                          <span>{question.question_text_en}</span>
                                        </div>
                                        {question.subtitle_en && (
                                          <p className="mb-2 text-xs text-muted-foreground">
                                            {question.subtitle_en}
                                          </p>
                                        )}
                                        <p className="whitespace-pre-line text-muted-foreground">
                                          {formatQuestionnaireAnswer(answer)}
                                        </p>
                                      </div>
                                    );
                                  })}
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          {/* Preferences Section - Dynamically filtered preference questions */}
                          <AccordionItem value="preferences" className="rounded-md border border-border">
                            <AccordionTrigger className="px-4 py-3 text-sm font-semibold">
                              Preferences
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                              <div className="space-y-4">
                                {getPreferenceQuestions(questionnaireQuestions).map((question) => {
                                    const answer = questionnaireAnswers[question.id];
                                    return (
                                      <div
                                        key={question.id}
                                        className="rounded-md border border-border p-3 text-sm"
                                      >
                                        <div className="mb-2 flex items-center gap-2 font-medium">
                                          <span>{question.question_text_en}</span>
                                        </div>
                                        {question.subtitle_en && (
                                          <p className="mb-2 text-xs text-muted-foreground">
                                            {question.subtitle_en}
                                          </p>
                                        )}
                                        <p className="whitespace-pre-line text-muted-foreground">
                                          {formatQuestionnaireAnswer(answer)}
                                        </p>
                                      </div>
                                    );
                                  })}
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          {/* Admin Information Section */}
                          <AccordionItem value="admin" className="rounded-md border border-border">
                            <AccordionTrigger className="px-4 py-3 text-sm font-semibold">
                              Admin Information
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                              <div className="grid gap-4 sm:grid-cols-2">
                                {renderInfoField("First name", selectedProfile.first_name)}
                                {renderInfoField("Last name", selectedProfile.last_name)}
                                {renderInfoField("Email", selectedProfile.email)}
                                {renderInfoField("Phone", selectedProfile.phone)}
                                {renderInfoField(
                                  "Location",
                                  [selectedProfile.city, selectedProfile.country].filter(Boolean).join(", ") ||
                                    "Location not set",
                                )}
                                {renderInfoField(
                                  "Date of birth",
                                  selectedProfile.date_of_birth ? formatDate(selectedProfile.date_of_birth) : "Not provided",
                                )}
                                {renderInfoField("Profession", selectedProfile.profession)}
                                {renderInfoField("Status", statusLabel)}
                                {renderInfoField("Profile completion", `${completionPercentage}%`)}
                                {selectedProfile.about_me && renderInfoField("About", selectedProfile.about_me)}
                                {adminNotesPreview && renderInfoField("Admin notes", adminNotesPreview)}
                                {selectedProfile.created_at && renderInfoField("Created", formatDate(selectedProfile.created_at))}
                                {selectedProfile.submitted_for_review_at && renderInfoField("Submitted for review", formatDate(selectedProfile.submitted_for_review_at))}
                                {selectedProfile.approved_at && renderInfoField("Approved", formatDate(selectedProfile.approved_at))}
                                {selectedProfile.rejected_at && renderInfoField("Rejected", formatDate(selectedProfile.rejected_at))}
                                {selectedProfile.deleted_at && renderInfoField("Deleted", formatDate(selectedProfile.deleted_at, true))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    </TabsContent>
                    <TabsContent value="matches" className="m-0 h-full overflow-hidden">
                      {matchesLoading ? (
                        <div className="flex h-full items-center justify-center">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : matchesError ? (
                        <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                          <p className="text-sm text-muted-foreground">{matchesError}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => selectedProfile && loadMatches(selectedProfile.id)}
                          >
                            Try again
                          </Button>
                        </div>
                      ) : (
                        <div className="flex h-full">
                          {/* Left Panel: Active Matches */}
                          <div className="flex-1 border-r overflow-auto px-6 py-6">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                  Active Matches ({matches.length})
                                </h3>
                              </div>

                              {matches.length > 0 ? (
                                <div className="space-y-3">
                                  {matches.map((match) => {
                                    const other = match.other_profile;
                                    const fullName = formatMatchName(other);
                                    const initials = fullName
                                      .split(" ")
                                      .map((part) => part?.[0] ?? "")
                                      .join("")
                                      .slice(0, 2)
                                      .toUpperCase() || "??";
                                    const location = formatMatchLocation(other);
                                    const statusMeta = getMatchStatusMeta(match.match_status);

                                    const handleActiveMatchClick = async () => {
                                      // Fetch match answers before opening modal
                                      try {
                                        const { data: matchProfileData, error: profileError } = await supabase
                                          .from("profiles")
                                          .select("user_id")
                                          .eq("id", other?.id)
                                          .single();

                                        if (profileError) throw profileError;

                                        const { data: matchAnswers, error: answersError } = await supabase
                                          .from("profile_answers")
                                          .select("question_id, answer")
                                          .eq("user_id", matchProfileData.user_id);

                                        if (answersError) throw answersError;

                                        const answersMap = (matchAnswers || []).reduce<ProfileAnswers>((acc, curr) => {
                                          acc[curr.question_id] = curr.answer;
                                          return acc;
                                        }, {});

                                        setSelectedMatchAnswers(answersMap);
                                        setSelectedMatchForDetails(match);
                                        setMatchDetailsOpen(true);
                                      } catch (error) {
                                        console.error("Failed to load match answers:", error);
                                        setSelectedMatchAnswers({});
                                        setSelectedMatchForDetails(match);
                                        setMatchDetailsOpen(true);
                                      }
                                    };

                                    return (
                                      <Card
                                        key={match.match_id}
                                        className="cursor-pointer hover:border-primary/50 transition-colors"
                                        onClick={handleActiveMatchClick}
                                      >
                                        <CardContent className="p-4">
                                          <div className="flex items-start gap-3">
                                            <Avatar className="h-10 w-10">
                                              <AvatarFallback>{initials}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 space-y-1">
                                              <div className="flex flex-wrap items-center gap-2">
                                                <p className="text-sm font-semibold">{fullName}</p>
                                                <Badge variant={statusMeta.variant} className="text-xs">
                                                  {statusMeta.label}
                                                </Badge>
                                              </div>
                                              {location && (
                                                <p className="text-xs text-muted-foreground">{location}</p>
                                              )}
                                              {other?.profession && (
                                                <p className="text-xs text-muted-foreground">{other.profession}</p>
                                              )}
                                            </div>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                              onClick={(event) => {
                                                event.stopPropagation();
                                                confirmDeleteMatch(match.match_id);
                                              }}
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="flex items-center justify-center rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                                  No active matches yet
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right Panel: Match Suggestions */}
                          <div className="flex-1 overflow-auto px-6 py-6 bg-muted/20">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                  Suggestions ({matchSuggestions.length})
                                </h3>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSuggestMatchesOpen(true)}
                                  className="gap-2"
                                >
                                  <Users className="h-4 w-4" />
                                  Add Matches
                                </Button>
                              </div>

                              {suggestionsLoading ? (
                                <div className="flex items-center justify-center py-12">
                                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                </div>
                              ) : matchSuggestions.length > 0 ? (
                                <div className="space-y-3">
                                  {matchSuggestions.map((suggestion) => {
                                    const other = suggestion.other_profile;
                                    const fullName = formatMatchName(other);
                                    const initials = fullName
                                      .split(" ")
                                      .map((part) => part?.[0] ?? "")
                                      .join("")
                                      .slice(0, 2)
                                      .toUpperCase() || "??";
                                    const location = formatMatchLocation(other);
                                    const compatibilityScore = suggestion.compatibility_score || 0;

                                    const handleSuggestionClick = async () => {
                                      // Fetch match answers before opening modal
                                      try {
                                        const { data: matchProfileData, error: profileError } = await supabase
                                          .from("profiles")
                                          .select("user_id")
                                          .eq("id", other?.id)
                                          .single();

                                        if (profileError) throw profileError;

                                        const { data: matchAnswers, error: answersError } = await supabase
                                          .from("profile_answers")
                                          .select("question_id, answer")
                                          .eq("user_id", matchProfileData.user_id);

                                        if (answersError) throw answersError;

                                        const answersMap = (matchAnswers || []).reduce<ProfileAnswers>((acc, curr) => {
                                          acc[curr.question_id] = curr.answer;
                                          return acc;
                                        }, {});

                                        setSelectedMatchAnswers(answersMap);
                                        setSelectedMatchForDetails(suggestion);
                                        setMatchDetailsOpen(true);
                                      } catch (error) {
                                        console.error("Failed to load match answers:", error);
                                        setSelectedMatchAnswers({});
                                        setSelectedMatchForDetails(suggestion);
                                        setMatchDetailsOpen(true);
                                      }
                                    };

                                    return (
                                      <Card
                                        key={suggestion.match_id}
                                        className="cursor-pointer hover:border-primary/50 transition-colors"
                                        onClick={handleSuggestionClick}
                                      >
                                        <CardContent className="p-4">
                                          <div className="flex items-start gap-3 mb-3">
                                            <Avatar className="h-10 w-10">
                                              <AvatarFallback>{initials}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 space-y-1">
                                              <p className="text-sm font-semibold">{fullName}</p>
                                              {location && (
                                                <p className="text-xs text-muted-foreground">{location}</p>
                                              )}
                                              {other?.profession && (
                                                <p className="text-xs text-muted-foreground">{other.profession}</p>
                                              )}
                                            </div>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                              onClick={(event) => {
                                                event.stopPropagation();
                                                confirmDeleteMatch(suggestion.match_id);
                                              }}
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </div>

                                          {/* Single Compatibility Score */}
                                          <div className="flex items-center justify-between">
                                            <span className="text-xs text-muted-foreground">Compatibility</span>
                                            <div className="flex items-center gap-2">
                                              <Progress value={compatibilityScore} className="h-2 w-24" />
                                              <span className="text-sm font-semibold w-10 text-right">{compatibilityScore}%</span>
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="flex items-center justify-center rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                                  No suggestions available
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="photos" className="m-0 h-full px-6 py-6 overflow-auto">
                      {sortedProfilePhotos.length ? (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {sortedProfilePhotos.map((photo, index) => (
                            <div
                              key={photo.photo_url || index}
                              className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted/50"
                            >
                              <img
                                src={photo.photo_url ?? undefined}
                                alt={`${currentFullName || "Client"} photo ${index + 1}`}
                                className="h-full w-full object-cover"
                              />
                              {index === 0 && sortedProfilePhotos.length > 0 && (
                                <Badge className="absolute left-2 top-2 text-xs">Primary</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex h-full items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
                          No photos uploaded yet.
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="notes" className="m-0 h-full px-6 py-6 overflow-auto">
                      <div className="h-full rounded-xl border border-border bg-background px-6 py-5 shadow-sm overflow-hidden">
                        <ClientNotesEditor
                          profileId={selectedProfile.id}
                          initialContent={selectedProfile.admin_notes}
                          initialUpdatedAt={selectedProfile.updated_at}
                        />
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              ) : (
                <div className="flex h-full items-center justify-center px-6 py-6 text-sm text-muted-foreground">
                  Select a client to view details
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject profile</DialogTitle>
            <DialogDescription>Provide a short explanation that will be shared with the client.</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for rejection"
            value={rejectionReason}
            onChange={(event) => setRejectionReason(event.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Reject profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Soft delete this profile?</AlertDialogTitle>
            <AlertDialogDescription>
              The client will disappear from active workflows but can be restored later. Matches and suggestions
              will no longer include this profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>
              Delete profile
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore this profile?</AlertDialogTitle>
            <AlertDialogDescription>
              The client will reappear in active lists and can again participate in matches and reviews.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore}>
              Restore profile
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Match Details Modal */}
      {selectedMatchForDetails && selectedProfile && (
        <MatchDetailsModal
          open={matchDetailsOpen}
          onClose={() => {
            setMatchDetailsOpen(false);
            setSelectedMatchForDetails(null);
            setSelectedMatchAnswers({});
          }}
          clientProfile={{
            id: selectedProfile.id,
            first_name: selectedProfile.first_name,
            last_name: selectedProfile.last_name,
            email: selectedProfile.email,
          }}
          matchProfile={{
            id: selectedMatchForDetails.other_profile?.id || "",
            first_name: selectedMatchForDetails.other_profile?.first_name || null,
            last_name: selectedMatchForDetails.other_profile?.last_name || null,
            email: selectedMatchForDetails.other_profile?.email || null,
          }}
          compatibilityScore={selectedMatchForDetails.compatibility_score || 0}
          clientAnswers={questionnaireAnswers}
          matchAnswers={selectedMatchAnswers}
          questions={questionnaireQuestions}
          onAddMatch={handleCreateMatchFromSuggestion}
        />
      )}

      {/* Suggest Matches Modal */}
      {selectedProfile && (
        <SuggestMatchesModal
          open={suggestMatchesOpen}
          onClose={() => setSuggestMatchesOpen(false)}
          clientId={selectedProfile.id}
          clientName={currentFullName}
          onMatchesCreated={() => {
            if (selectedProfile) {
              loadMatches(selectedProfile.id);
              loadMatchSuggestions(selectedProfile.id, questionnaireAnswers);
            }
          }}
        />
      )}

      {/* Delete Match Confirmation Dialog */}
      <AlertDialog open={deleteMatchDialogOpen} onOpenChange={setDeleteMatchDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Match?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this match suggestion and all related notifications and interactions.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingMatchId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMatch}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Match
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};


export default ClientsPage;
