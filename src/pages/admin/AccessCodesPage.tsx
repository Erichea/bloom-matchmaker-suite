import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  Code, 
  Plus, 
  Copy, 
  Calendar,
  Users,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const AccessCodesPage = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCodeData, setNewCodeData] = useState({
    eventName: "",
    eventDate: "",
    expiryDate: ""
  });

  // Mock data - will be replaced with real Supabase data
  const accessCodes = [
    {
      id: "1",
      code: "LONDON2024",
      eventName: "London Singles Event",
      eventDate: "2024-03-15",
      expiryDate: "2024-06-15",
      isUsed: false,
      usedBy: null,
      createdAt: "2024-01-10",
      totalUses: 0,
      maxUses: 50
    },
    {
      id: "2",
      code: "PARIS2024", 
      eventName: "Paris Networking Event",
      eventDate: "2024-04-20",
      expiryDate: "2024-07-20",
      isUsed: true,
      usedBy: "emma.wilson@email.com",
      createdAt: "2024-01-15",
      totalUses: 23,
      maxUses: 30
    },
    {
      id: "3",
      code: "NYC2024",
      eventName: "New York Professional Mixer", 
      eventDate: "2024-05-10",
      expiryDate: "2024-08-10",
      isUsed: false,
      usedBy: null,
      createdAt: "2024-01-20",
      totalUses: 12,
      maxUses: 40
    }
  ];

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreateCode = () => {
    // Logic to create new access code
    console.log("Creating new access code:", newCodeData);
    setIsCreateDialogOpen(false);
    setNewCodeData({ eventName: "", eventDate: "", expiryDate: "" });
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    // Add toast notification here
  };

  const getStatusBadge = (code: any) => {
    const now = new Date();
    const expiry = new Date(code.expiryDate);
    
    if (code.totalUses >= code.maxUses) {
      return <Badge variant="destructive">Maxed Out</Badge>;
    } else if (expiry < now) {
      return <Badge variant="secondary">Expired</Badge>;
    } else if (code.totalUses > 0) {
      return <Badge className="badge-warning">In Use</Badge>;
    } else {
      return <Badge className="badge-success">Available</Badge>;
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Access Code Management</h1>
            <p className="text-muted-foreground mt-2">
              Create and manage access codes for events and referrals
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-premium">
                <Plus className="mr-2 h-4 w-4" />
                Create Access Code
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Access Code</DialogTitle>
                <DialogDescription>
                  Generate a new access code for an event or special promotion.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="event-name">Event Name</Label>
                  <Input
                    id="event-name"
                    placeholder="London Singles Meetup"
                    value={newCodeData.eventName}
                    onChange={(e) => setNewCodeData({...newCodeData, eventName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-date">Event Date</Label>
                  <Input
                    id="event-date"
                    type="date"
                    value={newCodeData.eventDate}
                    onChange={(e) => setNewCodeData({...newCodeData, eventDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiry-date">Code Expiry Date</Label>
                  <Input
                    id="expiry-date"
                    type="date"
                    value={newCodeData.expiryDate}
                    onChange={(e) => setNewCodeData({...newCodeData, expiryDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Generated Code</Label>
                  <div className="flex space-x-2">
                    <Input value={generateRandomCode()} readOnly />
                    <Button variant="outline" size="sm">
                      <Code className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleCreateCode} className="btn-premium">
                  Create Code
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="card-premium">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Codes</p>
                  <p className="text-2xl font-bold text-foreground">12</p>
                </div>
                <Code className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="card-premium">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Codes</p>
                  <p className="text-2xl font-bold text-success">8</p>
                </div>
                <Calendar className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          <Card className="card-premium">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Uses</p>
                  <p className="text-2xl font-bold text-accent">247</p>
                </div>
                <Users className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>
          <Card className="card-premium">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold text-warning">35</p>
                </div>
                <Plus className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Access Codes List */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle>Access Codes</CardTitle>
            <CardDescription>Manage all your event access codes and track their usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {accessCodes.map((code) => (
                <div key={code.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border-soft hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-accent-muted flex items-center justify-center">
                      <Code className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-foreground">{code.code}</h3>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => copyToClipboard(code.code)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">{code.eventName}</p>
                      <p className="text-sm text-muted-foreground">
                        Event: {new Date(code.eventDate).toLocaleDateString()} • 
                        Expires: {new Date(code.expiryDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="flex items-center space-x-2 mb-1">
                        {getStatusBadge(code)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {code.totalUses}/{code.maxUses} uses
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(code.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Code
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Code
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Code
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccessCodesPage;