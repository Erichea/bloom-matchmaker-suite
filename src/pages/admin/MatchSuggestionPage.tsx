import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
import { Users, TrendingUp, CheckCircle, Clock, XCircle, Heart } from "lucide-react";

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
  const { toast } = useToast();
  const navigate = useNavigate();

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
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50 border-b-gray-200">
                  <TableHead className="font-semibold text-gray-600"><Users className="inline-block w-4 h-4 mr-2"/>Client</TableHead>
                  <TableHead className="text-center font-semibold text-gray-600"><TrendingUp className="inline-block w-4 h-4 mr-2"/>Total</TableHead>
                  <TableHead className="text-center font-semibold text-gray-600"><Clock className="inline-block w-4 h-4 mr-2"/>In Progress</TableHead>
                  <TableHead className="text-center font-semibold text-gray-600"><CheckCircle className="inline-block w-4 h-4 mr-2"/>Pending</TableHead>
                  <TableHead className="text-center font-semibold text-gray-600"><Heart className="inline-block w-4 h-4 mr-2"/>Mutual</TableHead>
                  <TableHead className="text-center font-semibold text-gray-600"><XCircle className="inline-block w-4 h-4 mr-2"/>Rejected</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.map((user) => (
                  <TableRow key={user.profile_id} onClick={() => handleRowClick(user.profile_id)} className="cursor-pointer hover:bg-gray-100/50">
                    <TableCell>
                      <div className="font-medium text-gray-800">{user.first_name} {user.last_name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </TableCell>
                    <TableCell className="text-center text-gray-600 font-medium">{user.total_matches}</TableCell>
                    <TableCell className="text-center text-gray-600 font-medium">{user.in_progress_matches}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">{user.pending_matches}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">{user.mutual_matches}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">{user.rejected_matches}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MatchSuggestionPage;
