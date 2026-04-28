import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
// import "@/utils/diagnostic"; // Import du diagnostic
// import "@/utils/debug-api"; // Import du debug API
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Classes from "./pages/Classes";
import Teachers from "./pages/Teachers";
import Subjects from "./pages/Subjects";
import Schedule from "./pages/Schedule";
import Payments from "./pages/Payments";
import FactureDetail from "./pages/FactureDetail.tsx";
import PaymentManagement from "./pages/PaymentManagement";
import TestPage from "./pages/TestPage";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import { SchoolLayout } from "./components/SchoolLayout";
import Profile from "./pages/Profile";
import Logout from "./pages/Logout";
import Tarifs from "./pages/Tarifs";
import Bourses from "./pages/Bourses";
import Relances from "./pages/Relances";
import Users from "./pages/Users";
import FraisPonctuels from "./pages/FraisPonctuels";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import StudentDetails from "./pages/StudentDetails";
import StudentEditInfo from "./pages/StudentEditInfo";
import BourseDetails from "./pages/BourseDetails";
import StudentPaymentView from "./pages/StudentPaymentView";
import ParentStudentPortalPage from "./pages/ParentStudentPortalPage";
import PaymentPlansPage from "./pages/PaymentPlansPage";
import StudentPortalPage from "./pages/StudentPortalPage";
import Monitoring from "./pages/Monitoring";

// Composant pour la redirection automatique basée sur le rôle
const RoleBasedRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-secondary">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirection basée sur le rôle
  switch (user.role) {
    case "admin":
    case "sous-admin":
    case "comptable":
      return <Navigate to="/dashboard" replace />;
    case "etudiant":
      return <Navigate to="/portal" replace />;
    case "parent":
      return <Navigate to="/portal" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

const App = () => (
  <>
    <Toaster />
    <Sonner />
    <Routes>
      <Route path="/" element={<RoleBasedRedirect />} />
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
          <ProtectedRoute roles={["admin", "sous-admin"]}>
            <SchoolLayout>
              <Students />
            </SchoolLayout>
          </ProtectedRoute>
        }
      />
      {/* Route for Student Details */}
      <Route
        path="/students/:id"
        element={
          <ProtectedRoute
            roles={["admin", "sous-admin", "comptable", "etudiant"]}
          >
            <SchoolLayout>
              <StudentDetails />
            </SchoolLayout>
          </ProtectedRoute>
        }
      />
      {/* Route for Student Payments & Invoices only */}
      <Route
        path="/students/:id/payments"
        element={
          <ProtectedRoute
            roles={["admin", "sous-admin", "comptable", "etudiant"]}
          >
            <SchoolLayout>
              <StudentPaymentView />
            </SchoolLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/students/:id/edit-info"
        element={
          <ProtectedRoute roles={["admin", "sous-admin"]}>
            <SchoolLayout>
              <StudentEditInfo />
            </SchoolLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/classes"
        element={
          <ProtectedRoute roles={["admin", "sous-admin"]}>
            <SchoolLayout>
              <Classes />
            </SchoolLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teachers"
        element={
          <ProtectedRoute roles={["admin", "sous-admin"]}>
            <SchoolLayout>
              <Teachers />
            </SchoolLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/subjects"
        element={
          <ProtectedRoute roles={["admin", "sous-admin"]}>
            <SchoolLayout>
              <Subjects />
            </SchoolLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/payments"
        element={
          <ProtectedRoute roles={["admin", "sous-admin", "comptable"]}>
            <SchoolLayout>
              <Payments />
            </SchoolLayout>
          </ProtectedRoute>
        }
      />
      {/* <Route
        path="/factures"
        element={
sous admin           <ProtectedRoute roles={["admin", "sous-admin", "comptable"]}>
            <SchoolLayout>
              <Factures />
            </SchoolLayout>
          </ProtectedRoute>
        }
      /> */}
      <Route
        path="/factures/:id"
        element={
          <ProtectedRoute
            roles={["admin", "sous-admin", "comptable", "etudiant"]}
          >
            <SchoolLayout>
              <FactureDetail />
            </SchoolLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/payment-management"
        element={
          <ProtectedRoute roles={["admin", "sous-admin", "comptable"]}>
            <SchoolLayout>
              <PaymentManagement />
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
          <ProtectedRoute roles={["admin", "sous-admin", "comptable"]}>
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
        path="/bourses/:id"
        element={
          <ProtectedRoute>
            <SchoolLayout>
              <BourseDetails />
            </SchoolLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/relances"
        element={
          <ProtectedRoute roles={["admin", "sous-admin", "comptable"]}>
            <SchoolLayout>
              <Relances />
            </SchoolLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute roles={["admin", "sous-admin"]}>
            <SchoolLayout>
              <Users />
            </SchoolLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/monitoring"
        element={
          <ProtectedRoute roles={["admin"]}>
            <SchoolLayout>
              <Monitoring />
            </SchoolLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/portal"
        element={
          <ProtectedRoute>
            <SchoolLayout>
              <StudentPortalPage />
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
        path="/fees"
        element={
          <ProtectedRoute roles={["admin", "sous-admin", "comptable"]}>
            <SchoolLayout>
              <FraisPonctuels />
            </SchoolLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/payment-plans"
        element={
          <ProtectedRoute roles={["admin", "sous-admin", "comptable"]}>
            <SchoolLayout>
              <PaymentPlansPage />
            </SchoolLayout>
          </ProtectedRoute>
        }
      />
      <Route path="/test" element={<TestPage />} />
      <Route
        path="/monitoring"
        element={
          <ProtectedRoute roles={["admin"]}>
            <SchoolLayout>
              <Monitoring />
            </SchoolLayout>
          </ProtectedRoute>
        }
      />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </>
);

export default App;
