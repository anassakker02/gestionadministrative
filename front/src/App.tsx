import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Classes from "./pages/Classes";
import Teachers from "./pages/Teachers";
import Subjects from "./pages/Subjects";
import Schedule from "./pages/Schedule";
import Payments from "./pages/Payments";
import NotFound from "./pages/NotFound";
import { SchoolLayout } from "./components/SchoolLayout";
import Factures from "./pages/Factures";
import Profile from "./pages/Profile";
import Logout from "./pages/Logout";
import Tarifs from "./pages/Tarifs";
import Bourses from "./pages/Bourses";
import Relances from "./pages/Relances";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import FraisPonctuels from "./pages/FraisPonctuels";
import Echeanciers from "./pages/Echeanciers";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <SchoolLayout>
                    <Dashboard />
                  </SchoolLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/students"
              element={
                <ProtectedRoute roles={["admin", "comptable"]}>
                  <SchoolLayout>
                    <Students />
                  </SchoolLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/classes"
              element={
                <ProtectedRoute roles={["admin", "comptable"]}>
                  <SchoolLayout>
                    <Classes />
                  </SchoolLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/teachers"
              element={
                <ProtectedRoute roles="admin">
                  <SchoolLayout>
                    <Teachers />
                  </SchoolLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/subjects"
              element={
                <ProtectedRoute roles="admin">
                  <SchoolLayout>
                    <Subjects />
                  </SchoolLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/echeanciers"
              element={
                <ProtectedRoute roles={["admin", "comptable"]}>
                  <SchoolLayout>
                    <Echeanciers />
                  </SchoolLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/schedules"
              element={
                <ProtectedRoute>
                  <SchoolLayout>
                    <Schedule />
                  </SchoolLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payments"
              element={
                <ProtectedRoute roles={["admin", "comptable"]}>
                  <SchoolLayout>
                    <Payments />
                  </SchoolLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/factures"
              element={
                <ProtectedRoute>
                  <SchoolLayout>
                    <Factures />
                  </SchoolLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <SchoolLayout>
                    <Profile />
                  </SchoolLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tarifs"
              element={
                <ProtectedRoute>
                  <SchoolLayout>
                    <Tarifs />
                  </SchoolLayout>
                </ProtectedRoute>
              }
            />
            <Route path="/logout" element={<Logout />} />
            <Route
              path="/bourses"
              element={
                <ProtectedRoute>
                  <SchoolLayout>
                    <Bourses />
                  </SchoolLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/relances"
              element={
                <ProtectedRoute roles={["admin", "comptable"]}>
                  <SchoolLayout>
                    <Relances />
                  </SchoolLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute roles={"admin"}>
                  <SchoolLayout>
                    <Users />
                  </SchoolLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute roles={"admin"}>
                  <SchoolLayout>
                    <Settings />
                  </SchoolLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/fees"
              element={
                <ProtectedRoute roles={["admin", "comptable"]}>
                  <SchoolLayout>
                    <FraisPonctuels />
                  </SchoolLayout>
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
