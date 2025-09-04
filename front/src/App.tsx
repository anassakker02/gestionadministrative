// App.tsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@radix-ui/react-tooltip";

// Création du QueryClient pour React Query
const queryClient = new QueryClient();

// Composants minimalistes pour que ça compile
const SchoolLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div>
    <h1>School Layout</h1>
    {children}
  </div>
);
const Dashboard = () => <div>Dashboard</div>;
const Students = () => <div>Students</div>;
const Classes = () => <div>Classes</div>;
const Teachers = () => <div>Teachers</div>;
const Subjects = () => <div>Subjects</div>;
const Schedule = () => <div>Schedule</div>;
const Payments = () => <div>Payments</div>;
const NotFound = () => <div>404 - Not Found</div>;

// App principal
const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
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
          {/* Route catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

