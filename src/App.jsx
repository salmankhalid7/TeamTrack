import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { LayoutProvider } from "./context/LayoutContext";
import { ToastProvider } from "./components/ui/Toast";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { DashboardSkeleton } from "./components/ui/Skeleton";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import NotFound from "./pages/NotFound";

// Lazy-loaded dashboards
import InternDashboard from "./pages/InternDashboard";
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboard"));
const QuizTakingPage = lazy(() => import("./pages/QuizTakingPage"));

// React Query client configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 3,
      refetchOnWindowFocus: import.meta.env.PROD ? false : true,
      placeholderData: (previousData) => previousData,
    },
    mutations: {
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <Router>
            <AuthProvider>
              <LayoutProvider>
                <div className="min-h-screen bg-[#f8f7f9] flex flex-col">
                  <main className="flex-1">
                    <Suspense
                      fallback={
                        <div className="flex items-center justify-center min-h-[60vh]">
                          <DashboardSkeleton />
                        </div>
                      }
                    >
                      <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<Landing />} />
                        <Route path="/login" element={<Login />} />

                        {/* Protected Intern Routes */}
                        <Route
                          path="/intern/quiz/:attemptId"
                          element={
                            <ProtectedRoute allowedRoles={["intern"]}>
                              <QuizTakingPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/intern/*"
                          element={
                            <ErrorBoundary>
                              <ProtectedRoute allowedRoles={["intern"]}>
                                <InternDashboard />
                              </ProtectedRoute>
                            </ErrorBoundary>
                          }
                        />

                        {/* Protected Admin Routes */}
                        <Route
                          path="/admin/*"
                          element={
                            <ErrorBoundary>
                              <ProtectedRoute allowedRoles={["admin"]}>
                                <AdminDashboardPage />
                              </ProtectedRoute>
                            </ErrorBoundary>
                          }
                        />

                        {/* 404 Not Found - catch-all route */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </main>
                </div>
              </LayoutProvider>
            </AuthProvider>
          </Router>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}