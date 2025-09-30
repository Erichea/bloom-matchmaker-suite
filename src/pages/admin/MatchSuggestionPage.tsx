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
            className="hover:bg-gray-100 px-2 -ml-2 transition-all duration-200"
          >
            <Users className="inline-block w-4 h-4 mr-2 text-indigo-600" />
            <span className="font-bold text-gray-900">Client</span>
            <ArrowUpDown className="ml-2 h-3.5 w-3.5 text-gray-400" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="py-1">
          <div className="font-semibold text-gray-900 text-sm">
            {row.original.first_name} {row.original.last_name}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">{row.original.email}</div>
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
            className="hover:bg-gray-100 px-2 w-full justify-center transition-all duration-200"
          >
            <TrendingUp className="inline-block w-4 h-4 mr-2 text-blue-600" />
            <span className="font-bold text-gray-900">Total</span>
            <ArrowUpDown className="ml-2 h-3.5 w-3.5 text-gray-400" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-center">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 font-bold text-sm">
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
            className="hover:bg-gray-100 px-2 w-full justify-center transition-all duration-200"
          >
            <Clock className="inline-block w-4 h-4 mr-2 text-blue-600" />
            <span className="font-bold text-gray-900">In Progress</span>
            <ArrowUpDown className="ml-2 h-3.5 w-3.5 text-gray-400" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-center">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 font-bold text-sm">
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
            className="hover:bg-gray-100 px-2 w-full justify-center transition-all duration-200"
          >
            <CheckCircle className="inline-block w-4 h-4 mr-2 text-amber-600" />
            <span className="font-bold text-gray-900">Pending</span>
            <ArrowUpDown className="ml-2 h-3.5 w-3.5 text-gray-400" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-center">
          <Badge className="bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border-amber-200 font-bold shadow-sm hover:shadow-md transition-all">
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
            className="hover:bg-gray-100 px-2 w-full justify-center transition-all duration-200"
          >
            <Heart className="inline-block w-4 h-4 mr-2 text-emerald-600" />
            <span className="font-bold text-gray-900">Mutual</span>
            <ArrowUpDown className="ml-2 h-3.5 w-3.5 text-gray-400" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-center">
          <Badge className="bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border-emerald-200 font-bold shadow-sm hover:shadow-md transition-all">
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
            className="hover:bg-gray-100 px-2 w-full justify-center transition-all duration-200"
          >
            <XCircle className="inline-block w-4 h-4 mr-2 text-rose-600" />
            <span className="font-bold text-gray-900">Rejected</span>
            <ArrowUpDown className="ml-2 h-3.5 w-3.5 text-gray-400" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-center">
          <Badge className="bg-gradient-to-r from-rose-100 to-red-100 text-rose-700 border-rose-200 font-bold shadow-sm hover:shadow-md transition-all">
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
      <div className="flex flex-col items-center justify-center h-screen gap-4 bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent absolute top-0 left-0"></div>
        </div>
        <p className="text-sm text-gray-500 font-medium animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="px-4 py-6 md:px-8 md:py-8 lg:px-12 lg:py-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                Match Dashboard
              </h1>
              {stats.length > 0 && (
                <Badge className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 px-3 py-1 text-sm font-bold shadow-sm">
                  {stats.length} {stats.length === 1 ? 'client' : 'clients'}
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600">
              Click on any client to view and manage their match suggestions
            </p>
          </div>

          {stats.length === 0 ? (
            <Card className="border-2 border-dashed border-gray-300 bg-gray-50/50">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 p-6 mb-4">
                  <Sparkles className="w-12 h-12 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No clients yet</h3>
                <p className="text-gray-600 text-center max-w-md">
                  Clients will appear here once they start creating profiles and receiving matches.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-xl overflow-hidden bg-white/80 backdrop-blur-sm">
              <CardContent className="p-0">
                {/* Search Bar */}
                <div className="p-6 border-b border-gray-200/60 bg-gradient-to-r from-gray-50 to-white">
                  <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      placeholder="Search by name or email..."
                      value={globalFilter ?? ""}
                      onChange={(e) => setGlobalFilter(e.target.value)}
                      className="pl-12 h-11 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 bg-white shadow-sm"
                    />
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id} className="bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 hover:to-gray-50 border-b border-gray-200">
                          {headerGroup.headers.map((header) => (
                            <TableHead key={header.id} className="font-bold text-gray-900">
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
                            className="cursor-pointer hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 transition-all duration-200 border-b border-gray-100 group"
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
                            <div className="flex flex-col items-center gap-2 text-gray-500">
                              <Search className="w-8 h-8 text-gray-300" />
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
                <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-gray-50 to-white border-t border-gray-200/60">
                  <div className="text-sm text-gray-600 font-medium">
                    Showing <span className="text-gray-900 font-bold">{table.getRowModel().rows.length}</span> of{" "}
                    <span className="text-gray-900 font-bold">{table.getFilteredRowModel().rows.length}</span> {table.getFilteredRowModel().rows.length === 1 ? 'result' : 'results'}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                      className="hover:bg-gray-100 disabled:opacity-50 transition-all duration-200 border-gray-300"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    <div className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-md text-sm font-bold shadow-sm">
                      Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                      className="hover:bg-gray-100 disabled:opacity-50 transition-all duration-200 border-gray-300"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchSuggestionPage;