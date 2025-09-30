import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, CheckCircle, Clock, XCircle, Heart, Search, ChevronLeft, ChevronRight, ArrowUpDown, Sparkles } from "lucide-react";

interface UserMatchStats {
  user_id: string;
  profile_id: string;
  first_name: string;
  last_name: string;
  email: string;
  total_matches: number;
  in_progress_matches: number;
  pending_matches: number;
  mutual_matches: number;
  rejected_matches: number;
}

const MatchSuggestionPage = () => {
  const [stats, setStats] = useState<UserMatchStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const columns: ColumnDef<UserMatchStats>[] = [
    {
      accessorFn: (row) => `${row.first_name} ${row.last_name}`,
      id: "client",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-muted px-2 -ml-2"
          >
            <Users className="inline-block w-4 h-4 mr-2 text-accent" />
            <span className="font-semibold">Client</span>
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="py-1">
          <div className="font-semibold text-sm">
            {row.original.first_name} {row.original.last_name}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">{row.original.email}</div>
        </div>
      ),
    },
    {
      accessorKey: "total_matches",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-muted px-2 w-full justify-center"
          >
            <TrendingUp className="inline-block w-4 h-4 mr-2 text-accent" />
            <span className="font-semibold">Total</span>
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-center">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-accent-soft text-accent font-semibold text-sm">
            {row.original.total_matches}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "in_progress_matches",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-muted px-2 w-full justify-center"
          >
            <Clock className="inline-block w-4 h-4 mr-2 text-accent" />
            <span className="font-semibold">In Progress</span>
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-center">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-accent-soft text-accent font-semibold text-sm">
            {row.original.in_progress_matches}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "pending_matches",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-muted px-2 w-full justify-center"
          >
            <CheckCircle className="inline-block w-4 h-4 mr-2" />
            <span className="font-semibold">Pending</span>
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-center">
          <Badge className="badge-warning">
            {row.original.pending_matches}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "mutual_matches",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-muted px-2 w-full justify-center"
          >
            <Heart className="inline-block w-4 h-4 mr-2" />
            <span className="font-semibold">Mutual</span>
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-center">
          <Badge className="badge-success">
            {row.original.mutual_matches}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "rejected_matches",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-muted px-2 w-full justify-center"
          >
            <XCircle className="inline-block w-4 h-4 mr-2" />
            <span className="font-semibold">Rejected</span>
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-center">
          <Badge className="badge-error">
            {row.original.rejected_matches}
          </Badge>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: stats,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  useEffect(() => {
    fetchUserMatchStats();
  }, []);

  const fetchUserMatchStats = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_user_match_stats');

      if (error) {
        throw error;
      }
      setStats(data || []);
    } catch (error: any) {
      toast({
        title: "Oops! Something went wrong",
        description: "We couldn't load the match statistics. Please try again.",
        variant: "destructive",
      });
      console.error("Error fetching user match stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (profileId: string) => {
    navigate(`/admin/matches/suggest/${profileId}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 bg-background">
        <div className="loading-spinner-lg text-accent"></div>
        <p className="text-sm text-muted-foreground font-medium animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container-app py-6 md:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
            <div className="flex items-center gap-3">
              <h1>Match Dashboard</h1>
              {stats.length > 0 && (
                <Badge className="badge-neutral">
                  {stats.length} {stats.length === 1 ? 'client' : 'clients'}
                </Badge>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Click on any client to view and manage their match suggestions
          </p>
        </div>

          {stats.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="rounded-full bg-accent-soft p-6 mb-4">
                  <Sparkles className="w-12 h-12 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No clients yet</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Clients will appear here once they start creating profiles and receiving matches.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search by name or email..."
                    value={globalFilter ?? ""}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="pl-10 input"
                  />
                </div>
              </div>

              {/* Desktop Table View */}
              <Card className="card hidden md:block">
                <CardContent className="p-0">

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                          <TableRow key={headerGroup.id} className="border-b">
                            {headerGroup.headers.map((header) => (
                              <TableHead key={header.id} className="font-semibold">
                                {header.isPlaceholder
                                  ? null
                                  : flexRender(
                                      header.column.columnDef.header,
                                      header.getContext()
                                    )}
                              </TableHead>
                            ))}
                          </TableRow>
                        ))}
                      </TableHeader>
                      <TableBody>
                        {table.getRowModel().rows?.length ? (
                          table.getRowModel().rows.map((row) => (
                            <TableRow
                              key={row.id}
                              onClick={() => handleRowClick(row.original.profile_id)}
                              className="cursor-pointer hover:bg-muted transition-colors"
                            >
                              {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id} className="py-4">
                                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={columns.length} className="h-32 text-center">
                              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <Search className="w-8 h-8" />
                                <p className="font-medium">No results found</p>
                                <p className="text-sm">Try adjusting your search</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Showing <span className="font-semibold text-foreground">{table.getRowModel().rows.length}</span> of{" "}
                      <span className="font-semibold text-foreground">{table.getFilteredRowModel().rows.length}</span> {table.getFilteredRowModel().rows.length === 1 ? 'result' : 'results'}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className="btn-secondary"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Previous
                      </Button>
                      <div className="px-3 py-1.5 bg-accent text-accent-foreground rounded-md text-sm font-semibold">
                        Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className="btn-secondary"
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <Card
                      key={row.id}
                      onClick={() => handleRowClick(row.original.profile_id)}
                      className="card-interactive"
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div>
                            <div className="font-semibold text-foreground">
                              {row.original.first_name} {row.original.last_name}
                            </div>
                            <div className="text-sm text-muted-foreground">{row.original.email}</div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <div className="flex items-center gap-1.5 text-sm">
                              <TrendingUp className="w-4 h-4 text-accent" />
                              <span className="font-semibold">{row.original.total_matches}</span>
                              <span className="text-muted-foreground">total</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm">
                              <Clock className="w-4 h-4 text-accent" />
                              <span className="font-semibold">{row.original.in_progress_matches}</span>
                              <span className="text-muted-foreground">in progress</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge className="badge-warning">
                              {row.original.pending_matches} pending
                            </Badge>
                            <Badge className="badge-success">
                              {row.original.mutual_matches} mutual
                            </Badge>
                            <Badge className="badge-error">
                              {row.original.rejected_matches} rejected
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Search className="w-12 h-12 text-muted-foreground mb-2" />
                      <p className="font-medium text-muted-foreground">No results found</p>
                      <p className="text-sm text-muted-foreground">Try adjusting your search</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchSuggestionPage;