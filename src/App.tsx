import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useParams, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { TourBuilderProvider } from "@/contexts/TourBuilderContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import ConversationPage from "./pages/ConversationPage";
import Index from "./pages/Index";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";

// Lazy-loaded pages — only fetched when the user navigates to them
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const UpgradePage = lazy(() => import("./pages/UpgradePage"));
const SharedTourPage = lazy(() => import("./pages/SharedTourPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));

/**
 * Handles /r/:code — stores the code and redirects to /auth?ref=CODE.
 * This preserves the referral code across page loads.
 */
function ReferralRedirect() {
  const { code } = useParams<{ code: string }>();
  if (code) {
    localStorage.setItem('pending_referral_code', code.toUpperCase());
    return <Navigate to={`/auth?ref=${encodeURIComponent(code.toUpperCase())}`} replace />;
  }
  return <Navigate to="/auth" replace />;
}

/** Minimal loading spinner shown while lazy chunks load */
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-foreground/10 border-t-foreground rounded-full animate-spin" />
  </div>
);

// Initialize PostHog
const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
const posthogHost = import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com";

if (posthogKey) {
  posthog.init(posthogKey, {
    api_host: posthogHost,
    person_profiles: "identified_only",
    capture_pageview: false, // We capture manually with react-router
    capture_pageleave: true,
  });
}

/** Captures pageviews on route change */
function PostHogPageviewTracker() {
  const location = useLocation();
  useEffect(() => {
    if (posthogKey) {
      posthog.capture("$pageview", {
        $current_url: window.location.href,
      });
    }
  }, [location.pathname, location.search]);
  return null;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

const App = () => (
  <ErrorBoundary level="page">
    <PostHogProvider client={posthog}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ThemeProvider>
          <AuthProvider>
            <TourBuilderProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <PostHogPageviewTracker />
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<ConversationPage />} />
                    <Route path="/classic" element={<Index />} />
                    <Route path="/explore" element={<Index />} />
                    <Route path="/explore/build" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/dashboard" element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/profile" element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin" element={
                      <AdminRoute>
                        <AdminDashboard />
                      </AdminRoute>
                    } />
                    <Route path="/upgrade" element={<UpgradePage />} />
                    <Route path="/tour/:slug" element={<SharedTourPage />} />
                    {/* Referral entry point — redirects to /auth?ref=CODE */}
                    <Route path="/r/:code" element={<ReferralRedirect />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </TourBuilderProvider>
          </AuthProvider>
          </ThemeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </PostHogProvider>
  </ErrorBoundary>
);

export default App;
