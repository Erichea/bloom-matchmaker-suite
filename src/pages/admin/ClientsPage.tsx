import type { ComponentType } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  Calendar,
  Loader2,
  CheckCircle,
  Clock,
  Check,
  X,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { profileQuestionCategories, profileQuestions } from "@/constants/profileQuestions";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
}

type ViewMode = "active" | "deleted";

type QuestionnaireAnswers = Record<string, any>;

type StatusFilter = "all" | "pending_approval" | "approved" | "rejected" | "incomplete";

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
  const userId = user?.id ?? null;

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
  const [detailLoading, setDetailLoading] = useState(false);

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);

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
        const query = supabase
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
          )
          .order("created_at", { ascending: false });

        if (currentView === "active") {
          query.is("deleted_at", null);
        } else {
          query.not("deleted_at", "is", null);
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        setClients((data as ClientRow[]) || []);
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

  const loadClientDetails = useCallback(
    async (profileId: string) => {
      try {
        setDetailLoading(true);
        setSelectedProfile(null);
        setQuestionnaireAnswers({});

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

        const detailedProfile = profile as DetailedProfile;

        if (detailedProfile?.user_id) {
          const { data: answersData, error: answersError } = await supabase
            .from("profile_answers")
            .select("question_id, answer")
            .eq("user_id", detailedProfile.user_id);

          if (answersError) {
            throw answersError;
          }

          const answersMap = (answersData || []).reduce<QuestionnaireAnswers>((acc, curr) => {
            acc[curr.question_id] = curr.answer;
            return acc;
          }, {});

          setQuestionnaireAnswers(answersMap);
        }

        setSelectedProfile(detailedProfile);
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
    [toast],
  );

  useEffect(() => {
    fetchClients(view);
  }, [fetchClients, view]);

  useEffect(() => {
    updateStatusFilter("all");
    setGlobalFilter("");
  }, [view, updateStatusFilter]);

  useEffect(() => {
    if (cockpitOpen && selectedClientId) {
      loadClientDetails(selectedClientId);
    }
  }, [cockpitOpen, selectedClientId, loadClientDetails]);

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

        if (data?.success) {
          toast({ title: "Profile approved" });
          await refreshData();
        } else {
          throw new Error(data?.message || "Failed to approve profile");
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

      if (data?.success) {
        toast({ title: "Profile rejected" });
        setRejectDialogOpen(false);
        setRejectionReason("");
        await refreshData();
      } else {
        throw new Error(data?.message || "Failed to reject profile");
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
      const { data, error } = await supabase.rpc("soft_delete_profile", {
        p_profile_id: selectedClientId,
        p_admin_id: userId,
      });

      if (error) throw error;

      if (data?.success) {
        toast({ title: "Profile deleted" });
        setDeleteDialogOpen(false);
        setCockpitOpen(false);
        setSelectedClientId(null);
        await fetchClients(view);
      } else {
        throw new Error(data?.message || "Failed to delete profile");
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
      const { data, error } = await supabase.rpc("restore_profile", {
        p_profile_id: selectedClientId,
        p_admin_id: userId,
      });

      if (error) throw error;

      if (data?.success) {
        toast({ title: "Profile restored" });
        setRestoreDialogOpen(false);
        setCockpitOpen(false);
        setSelectedClientId(null);
        await fetchClients(view);
      } else {
        throw new Error(data?.message || "Failed to restore profile");
      }
    } catch (error: any) {
      toast({
        title: "Restore failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
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

      <Sheet open={cockpitOpen} onOpenChange={setCockpitOpen}>
        <SheetContent className="w-full sm:max-w-xl md:max-w-3xl flex flex-col p-0">
          <SheetHeader className="border-b px-6 py-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  {currentPrimaryPhoto ? (
                    <AvatarImage src={currentPrimaryPhoto} alt={currentFullName} />
                  ) : (
                    <AvatarFallback>{currentFullName.slice(0, 2).toUpperCase() || "?"}</AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <SheetTitle>{currentFullName || "Client profile"}</SheetTitle>
                  <SheetDescription>
                    {selectedProfile?.email ? selectedProfile.email : "No email on file"}
                  </SheetDescription>
                </div>
              </div>
              {selectedProfile?.deleted_at ? (
                <Badge variant="outline" className="text-xs">Deleted {formatDate(selectedProfile.deleted_at)}</Badge>
              ) : (
                selectedProfile && (
                  <Badge className={
                    selectedProfile.status === "approved"
                      ? "badge-success"
                      : selectedProfile.status === "pending_approval"
                        ? "badge-warning"
                        : selectedProfile.status === "rejected"
                          ? "badge-error"
                          : ""
                  }>
                    {selectedProfile.status === "pending_approval" ? "Pending review" : selectedProfile.status.replace("_", " ")}
                  </Badge>
                )
              )}
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1">
            {detailLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : selectedProfile ? (
              <div className="space-y-6 px-6 py-6">
                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <h3 className="text-sm font-semibold text-muted-foreground">Contact</h3>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedProfile.email || "No email on file"}</span>
                      </div>
                      {selectedProfile.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-muted-foreground">Phone</span>
                          <span>{selectedProfile.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {[selectedProfile.city, selectedProfile.country].filter(Boolean).join(", ") || "Location not set"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <h3 className="text-sm font-semibold text-muted-foreground">Profile Status</h3>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        <span>Completion: {selectedProfile.completion_percentage ?? 0}%</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Created {formatDate(selectedProfile.created_at)}</span>
                      </div>
                      {selectedProfile.submitted_for_review_at && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>
                            Submitted {formatDate(selectedProfile.submitted_for_review_at)}
                          </span>
                        </div>
                      )}
                      {selectedProfile.approved_at && (
                        <div className="flex items-center gap-2 text-sm">
                          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                          <span>Approved {formatDate(selectedProfile.approved_at)}</span>
                        </div>
                      )}
                      {selectedProfile.rejected_at && (
                        <div className="flex items-center gap-2 text-sm">
                          <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                          <span>Rejected {formatDate(selectedProfile.rejected_at)}</span>
                        </div>
                      )}
                      {selectedProfile.deleted_at && (
                        <div className="flex items-center gap-2 text-sm">
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                          <span>Deleted {formatDate(selectedProfile.deleted_at, true)}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </section>

                <section>
                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <h3 className="text-sm font-semibold text-muted-foreground">About</h3>
                      <div className="space-y-2 text-sm leading-relaxed">
                        <div>
                          <span className="font-medium text-muted-foreground">Profession: </span>
                          <span>{selectedProfile.profession || "Not specified"}</span>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">About me: </span>
                          <span>{selectedProfile.about_me || "No introduction provided"}</span>
                        </div>
                        {selectedProfile.admin_notes && (
                          <div>
                            <span className="font-medium text-muted-foreground">Admin notes: </span>
                            <span>{selectedProfile.admin_notes}</span>
                          </div>
                        )}
                        {selectedProfile.rejection_reason && (
                          <div>
                            <span className="font-medium text-muted-foreground">Last rejection reason: </span>
                            <span>{selectedProfile.rejection_reason}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">Questionnaire answers</h3>
                  {Object.keys(questionnaireAnswers).length === 0 && (
                    <Card className="border-warning/50 bg-warning/5 mb-4">
                      <CardContent className="p-4">
                        <p className="text-sm text-warning">
                          No questionnaire answers found. The user may not have started the questionnaire yet, or the completion percentage may be incorrect.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                  <div className="space-y-4">
                    {profileQuestionCategories.map((category) => {
                      const categoryQuestions = profileQuestions.filter((question) => question.category === category);
                      const answeredCount = categoryQuestions.filter((question) => questionnaireAnswers[question.id]).length;
                      const isComplete = answeredCount === categoryQuestions.length;

                      return (
                        <Card key={category} className="border-muted">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm text-foreground">{category}</p>
                                <p className="text-xs text-muted-foreground">
                                  {answeredCount} of {categoryQuestions.length} answered
                                </p>
                              </div>
                            </div>
                            <div className="space-y-3">
                              {categoryQuestions.map((question) => {
                                const AnswerIcon = question.icon;
                                const answer = questionnaireAnswers[question.id];
                                return (
                                  <div key={question.id} className="border border-border rounded-md p-3">
                                    <div className="flex items-center gap-2 text-sm font-medium mb-2">
                                      <AnswerIcon className="h-4 w-4 text-muted-foreground" />
                                      <span>{question.title}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                                      {formatAnswer(answer)}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </section>
              </div>
            ) : (
              <div className="flex items-center justify-center py-16">
                <p className="text-sm text-muted-foreground">Select a client to view details</p>
              </div>
            )}
          </ScrollArea>

          <div className="border-t px-6 py-4 flex flex-wrap items-center gap-2 justify-between">
            <div className="flex flex-wrap gap-2">
              {selectedProfile?.status === "pending_approval" && !selectedProfile.deleted_at && (
                <>
                  <Button size="sm" onClick={handleApprove} className="btn-accent">
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRejectDialogOpen(true)}
                    className="btn-secondary"
                  >
                    Reject
                  </Button>
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedProfile?.deleted_at ? (
                <Button size="sm" className="btn-accent" onClick={() => setRestoreDialogOpen(true)}>
                  <Undo2 className="h-4 w-4 mr-1" /> Restore
                </Button>
              ) : (
                <Button size="sm" variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

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
    </div>
  );
};

export default ClientsPage;
