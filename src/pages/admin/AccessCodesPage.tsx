import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Copy, Calendar, Users, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const generateCodeSchema = z.object({
  eventName: z.string().min(2, "Event name must be at least 2 characters"),
  eventDate: z.string().optional(),
  expiresAt: z.string().optional(),
  notes: z.string().optional(),
});

type GenerateCodeForm = z.infer<typeof generateCodeSchema>;

const AccessCodesPage = () => {
  const [accessCodes, setAccessCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<GenerateCodeForm>({
    resolver: zodResolver(generateCodeSchema),
    defaultValues: {
      eventName: "",
      eventDate: "",
      expiresAt: "",
      notes: "",
    },
  });

  useEffect(() => {
    fetchAccessCodes();
  }, []);

  const fetchAccessCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('access_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccessCodes(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch access codes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateRandomCode = () => {
    const characters = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789'; // Exclude O and 0 for clarity
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  const handleGenerateCode = async (data: GenerateCodeForm) => {
    setGenerating(true);
    try {
      const newCode = generateRandomCode();
      
      const { error } = await supabase
        .from('access_codes')
        .insert({
          code: newCode,
          event_name: data.eventName,
          event_date: data.eventDate || null,
          expires_at: data.expiresAt || null,
        });

      if (error) throw error;

      toast({
        title: "Access Code Generated",
        description: `Code ${newCode} has been created successfully.`,
      });

      form.reset();
      setDialogOpen(false);
      fetchAccessCodes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to generate access code",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied",
      description: "Access code copied to clipboard",
    });
  };

  const getStatusBadge = (code: any) => {
    if (code.is_used) {
      return <Badge className="bg-success text-success-foreground">Used</Badge>;
    }
    if (code.expires_at && new Date(code.expires_at) < new Date()) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    return <Badge className="bg-primary text-primary-foreground">Active</Badge>;
  };

  const getStatusIcon = (code: any) => {
    if (code.is_used) {
      return <CheckCircle className="w-4 h-4 text-success" />;
    }
    if (code.expires_at && new Date(code.expires_at) < new Date()) {
      return <AlertTriangle className="w-4 h-4 text-destructive" />;
    }
    return <Clock className="w-4 h-4 text-primary" />;
  };

  const stats = {
    total: accessCodes.length,
    active: accessCodes.filter(code => !code.is_used && (!code.expires_at || new Date(code.expires_at) > new Date())).length,
    used: accessCodes.filter(code => code.is_used).length,
    expired: accessCodes.filter(code => !code.is_used && code.expires_at && new Date(code.expires_at) < new Date()).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Access Codes</h1>
          <p className="text-muted-foreground">
            Generate and manage access codes for client registration
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-premium">
              <Plus className="mr-2 h-4 w-4" />
              Generate Code
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Generate New Access Code</DialogTitle>
              <DialogDescription>
                Create a new access code for client registration
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleGenerateCode)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="eventName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Spring Mixer 2024" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="eventDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expiresAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expires At</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Optional notes about this access code..."
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={generating} className="btn-premium">
                    {generating ? "Generating..." : "Generate Code"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-primary mb-2">{stats.total}</div>
            <p className="text-muted-foreground">Total Codes</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-success mb-2">{stats.active}</div>
            <p className="text-muted-foreground">Active Codes</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-accent mb-2">{stats.used}</div>
            <p className="text-muted-foreground">Used Codes</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-destructive mb-2">{stats.expired}</div>
            <p className="text-muted-foreground">Expired Codes</p>
          </CardContent>
        </Card>
      </div>

      {/* Access Codes Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Access Codes</CardTitle>
          <CardDescription>
            Manage and monitor all generated access codes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Used By</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accessCodes.map((code) => (
                <TableRow key={code.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(code)}
                      <span className="font-mono font-medium">{code.code}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{code.event_name}</div>
                      {code.event_date && (
                        <div className="text-sm text-muted-foreground flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {format(new Date(code.event_date), 'MMM dd, yyyy')}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(code)}</TableCell>
                  <TableCell>
                    {format(new Date(code.created_at), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    {code.expires_at 
                      ? format(new Date(code.expires_at), 'MMM dd, yyyy')
                      : 'Never'
                    }
                  </TableCell>
                  <TableCell>
                    {code.used_by ? (
                      <span className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        User #{code.used_by.slice(0, 8)}...
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Not used</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(code.code)}
                      className="mr-2"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {accessCodes.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg mb-4">No access codes generated yet</p>
              <Button onClick={() => setDialogOpen(true)} className="btn-premium">
                <Plus className="mr-2 h-4 w-4" />
                Generate Your First Code
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessCodesPage;