import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./lib/i18n.ts"; // Import i18n configuration
import { I18nextProvider } from "react-i18next";
import i18n from "./lib/i18n";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <I18nextProvider i18n={i18n}>
            <App />
          </I18nextProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
