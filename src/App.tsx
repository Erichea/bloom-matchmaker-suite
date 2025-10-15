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
import NotificationDebug from "./pages/NotificationDebug";
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
import MutualMatches from "./pages/MutualMatches";
import ProfileViewPage from "./pages/ProfileViewPage";
import PreferencesEditPage from "./pages/PreferencesEditPage";
import LogoutPage from "./pages/LogoutPage";
import { AdminLayout } from "./components/AdminLayout";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { NotificationProvider } from "./components/NotificationProvider";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <NotificationProvider>
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
            <Route path="/notification-debug" element={<NotificationDebug />} />
            <Route path="/client/profile/edit" element={<ProtectedRoute><ProfileEditPage /></ProtectedRoute>} />
            <Route path="/client/profile/preferences" element={<ProtectedRoute><PreferencesEditPage /></ProtectedRoute>} />
            <Route path="/client/dashboard" element={<ProtectedRoute><ClientDashboard /></ProtectedRoute>} />
            <Route path="/client/mutual-matches" element={<ProtectedRoute><MutualMatches /></ProtectedRoute>} />
            <Route path="/client/updates" element={<ProtectedRoute><ClientUpdates /></ProtectedRoute>} />
            <Route path="/client/profile" element={<ProtectedRoute><ProfileViewPage /></ProtectedRoute>} />
            <Route path="/client/settings/notifications" element={
              <ProtectedRoute>
                <NotificationSettings />
              </ProtectedRoute>
            } />
            <Route path="/logout" element={<LogoutPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </NotificationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
