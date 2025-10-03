import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLoginPage from "./pages/AdminLoginPage";
import ClientWelcome from "./pages/ClientWelcome";
import ClientDashboard from "./pages/ClientDashboard";
import AuthPage from "./pages/AuthPage";
import ProfileSetup from "./pages/ProfileSetup";
import OnboardingFlow from "./pages/OnboardingFlow";
import ProfileEditPage from "./pages/ProfileEditPage";
import NotFound from "./pages/NotFound";
import ClientsPage from "./pages/admin/ClientsPage";
import AccessCodesPage from "./pages/admin/AccessCodesPage";
import MatchSuggestionPage from "./pages/admin/MatchSuggestionPage";
import UserMatchKanbanPage from "./pages/admin/UserMatchKanbanPage";
import MatchManagementPage from "./pages/admin/MatchManagementPage";
import { AdminUpdates } from "./pages/admin/AdminUpdates";
import { ClientUpdates } from "./pages/ClientUpdates";
import NotificationSettings from "./pages/NotificationSettings";
import { AdminLayout } from "./components/AdminLayout";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/clients" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminLayout>
                  <ClientsPage />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/clients/pending" element={<Navigate to="/admin/clients" replace />} />
            <Route path="/admin/clients/reviews" element={<Navigate to="/admin/clients" replace />} />
            <Route path="/admin/access-codes" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminLayout>
                  <AccessCodesPage />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/matches/suggest" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminLayout>
                  <MatchSuggestionPage />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/matches/suggest/:profileId" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminLayout>
                  <UserMatchKanbanPage />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/matches" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminLayout>
                  <MatchManagementPage />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/updates" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminUpdates />
              </ProtectedRoute>
            } />
            <Route path="/client" element={<ClientWelcome />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/profile-setup" element={<ProfileSetup />} />
            <Route path="/onboarding" element={
              <ProtectedRoute>
                <OnboardingFlow />
              </ProtectedRoute>
            } />
            <Route path="/client/profile/edit" element={<ProfileEditPage />} />
            <Route path="/client/dashboard" element={<ClientDashboard />} />
            <Route path="/client/updates" element={<ClientUpdates />} />
            <Route path="/client/profile" element={<ProfileEditPage />} />
            <Route path="/client/settings/notifications" element={
              <ProtectedRoute>
                <NotificationSettings />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
