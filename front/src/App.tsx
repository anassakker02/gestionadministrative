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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={
            <SchoolLayout>
              <Dashboard />
            </SchoolLayout>
          } />
          <Route path="/students" element={
            <SchoolLayout>
              <Students />
            </SchoolLayout>
          } />
          <Route path="/classes" element={
            <SchoolLayout>
              <Classes />
            </SchoolLayout>
          } />
          <Route path="/teachers" element={
            <SchoolLayout>
              <Teachers />
            </SchoolLayout>
          } />
          <Route path="/subjects" element={
            <SchoolLayout>
              <Subjects />
            </SchoolLayout>
          } />
          <Route path="/schedule" element={
            <SchoolLayout>
              <Schedule />
            </SchoolLayout>
          } />
          <Route path="/payments" element={
            <SchoolLayout>
              <Payments />
            </SchoolLayout>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
