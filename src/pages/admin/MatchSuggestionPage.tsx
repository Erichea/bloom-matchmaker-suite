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
import { Users, TrendingUp, CheckCircle, Clock, XCircle, Heart, Search, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";

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
            className="hover:bg-transparent p-0"
          >
            <Users className="inline-block w-4 h-4 mr-2" />
            Client
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-gray-800">
            {row.original.first_name} {row.original.last_name}
          </div>
          <div className="text-sm text-gray-500">{row.original.email}</div>
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
            className="hover:bg-transparent p-0 w-full"
          >
            <TrendingUp className="inline-block w-4 h-4 mr-2" />
            Total
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-center text-gray-600 font-medium">
          {row.original.total_matches}
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
            className="hover:bg-transparent p-0 w-full"
          >
            <Clock className="inline-block w-4 h-4 mr-2" />
            In Progress
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-center text-gray-600 font-medium">
          {row.original.in_progress_matches}
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
            className="hover:bg-transparent p-0 w-full"
          >
            <CheckCircle className="inline-block w-4 h-4 mr-2" />
            Pending
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-center">
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
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
            className="hover:bg-transparent p-0 w-full"
          >
            <Heart className="inline-block w-4 h-4 mr-2" />
            Mutual
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-center">
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
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
            className="hover:bg-transparent p-0 w-full"
          >
            <XCircle className="inline-block w-4 h-4 mr-2" />
            Rejected
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-center">
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
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
        title: "Error fetching stats",
        description: "Could not load user match statistics. Please try again.",
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
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Match Dashboard</h1>
          <p className="text-gray-500 mt-1">Click on a user to view and manage their matches.</p>
        </div>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            {/* Search Bar */}
            <div className="flex items-center mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search clients..."
                  value={globalFilter ?? ""}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="bg-gray-50 hover:bg-gray-50">
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} className="font-semibold text-gray-600">
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
                        className="cursor-pointer hover:bg-gray-100/50"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center">
                        No results.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Showing {table.getRowModel().rows.length} of {table.getFilteredRowModel().rows.length} results
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <div className="text-sm text-gray-600">
                  Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MatchSuggestionPage;