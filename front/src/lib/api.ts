import axios, { AxiosHeaders, type AxiosRequestHeaders } from "axios";

// Configuration de l'URL de base
// En développement : utilise le proxy Vite
// En production : utilise VITE_API_BASE_URL
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "/gestionadminastration/us-central1/api/v1";

// Forcer l'utilisation du proxy en développement
const isDevelopment = import.meta.env.DEV;
const finalBaseURL = isDevelopment
  ? "/gestionadminastration/us-central1/api/v1"
  : API_BASE_URL;

const axiosInstance = axios.create({
  baseURL: finalBaseURL,
  // Do not force a global Content-Type header here. Some requests (FormData) must let the browser set the proper multipart boundary.
  withCredentials: false,
  timeout: 15000, // 15 secondes de timeout pour les émulateurs (plus robuste)
});

// Log pour diagnostiquer les problèmes de connexion
console.log("API Base URL:", finalBaseURL);
console.log("Mode développement:", isDevelopment);
console.log("VITE_API_BASE_URL:", import.meta.env.VITE_API_BASE_URL);

// (removed duplicate simple request interceptor)

// Function to get new access token using refresh token
export const refreshAccessToken = async () => {
  try {
    const refreshToken = sessionStorage.getItem("refreshToken");
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }
    // Assume a refresh token endpoint exists at /auth/refresh-token
    const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
      refreshToken,
    });
    // Backend renvoie { data: { accessToken, refreshToken } }
    const { accessToken, refreshToken: refreshedToken } = response.data.data;
    sessionStorage.setItem("token", accessToken); // Update access token
    if (refreshedToken) {
      sessionStorage.setItem("refreshToken", refreshedToken); // Update refresh token if rotated
    }
    return accessToken;
  } catch (error) {
    console.error("Error refreshing access token:", error);
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("refreshToken");
    // Optionally redirect to login page
    window.location.href = "/login";
    throw error;
  }
};

// Request interceptor for attaching tokens
axiosInstance.interceptors.request.use(
  async (config) => {
    console.log("🚀 Making request to:", config.url);
    console.log("📡 Full URL:", `${config.baseURL}${config.url}`);

    const token = sessionStorage.getItem("token");
    console.log(
      "Frontend Interceptor - Retrieved Token:",
      token ? "Token exists" : "No token",
    );
    if (token) {
      // Ensure headers exist and set Authorization in a type-safe way
      if (!config.headers) {
        config.headers = new AxiosHeaders() as unknown as AxiosRequestHeaders;
      }
      if (config.headers instanceof AxiosHeaders) {
        (config.headers as AxiosHeaders).set(
          "Authorization",
          `Bearer ${token}`,
        );
      } else {
        (config.headers as unknown as Record<string, string>)["Authorization"] =
          `Bearer ${token}`;
      }
      console.log(
        "Frontend Interceptor - Setting Authorization header:",
        (config.headers as Record<string, string>)["Authorization"],
      );
    }
    // No cookies/session-based auth; keep credentials disabled
    config.withCredentials = false;

    // Ajouter un timestamp pour éviter le cache
    if (config.method === "get") {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }

    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  },
);

// Response interceptor for handling token expiration and refreshing
axiosInstance.interceptors.response.use(
  (response) => {
    console.log("✅ Response received:", response.status, response.config.url);
    return response;
  },
  async (error) => {
    console.error("❌ Response error:", error.message);
    console.error("❌ Error details:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      code: error.code,
      timeout: error.code === "ECONNABORTED",
    });

    // Gérer les timeouts et erreurs de connexion
    if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
      console.warn(
        "⏰ Timeout détecté - vérifiez que l'émulateur Firebase est démarré (firebase emulators:start)",
      );
    }
    const originalRequest = error.config;
    const status = error.response?.status;
    const data = error.response?.data || {};
    const code = (data && (data.code || data.error?.code)) || "";
    const message = (data && (data.message || data.error)) || "";

    // Déconnexion immédiate si le backend indique un token expiré ou un compte inactif
    if (
      (status === 401 || status === 403) &&
      (code === "TOKEN_EXPIRED" ||
        code === "ACCOUNT_INACTIVE" ||
        /token\s*expir/i.test(String(message)))
    ) {
      try {
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("refreshToken");
      } finally {
        const path = window.location.pathname;
        if (path !== "/login" && path !== "/logout") {
          window.location.href = "/login";
        }
      }
      return Promise.reject(error);
    }

    // Si 401 et pas encore retenté, tenter un refresh (autres cas)
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark as retried
      try {
        const newAccessToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest); // Retry the original request
      } catch (refreshError) {
        // Refresh failed, probably refresh token expired or invalid
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

// Utilisation pour GET
export const fetcher = async (url: string) => {
  console.log("Fetching URL:", `${API_BASE_URL}${url}`); // Temporary log
  const response = await axiosInstance.get(url);
  return response.data;
};

// Utilisation pour POST, PUT, DELETE
export const apiRequest = async (
  url: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  data?: Record<string, unknown>,
) => {
  // Build config dynamically so we can handle FormData correctly
  const config: {
    url: string;
    method: "GET" | "POST" | "PUT" | "DELETE";
    data?: unknown;
    headers?: Record<string, string>;
  } = { url, method };

  if (data !== undefined) {
    // If data is a FormData instance (file upload), do not set Content-Type - the browser will set it including the boundary
    if (typeof FormData !== "undefined" && data instanceof FormData) {
      config.data = data;
    } else {
      config.data = data;
      config.headers = {
        ...(config.headers || {}),
        "Content-Type": "application/json",
      };
    }
  }

  const response = await axiosInstance.request(config);
  return response.data;
};

// Fonction pour tester la connectivité avec l'émulateur (via le proxy Vite)
export const testConnectivity = async () => {
  try {
    console.log(`🔍 Test de connectivité vers l'API...`);
    // Utilise l'instance axios configurée (passe par le proxy Vite)
    const response = await axiosInstance.get("/health", { timeout: 5000 });
    console.log("✅ API accessible:", response.status);
    return { success: true, status: response.status, data: response.data };
  } catch (error: any) {
    console.warn(`⚠️ API non accessible:`, error.message);
    return {
      success: false,
      error: error.message,
      code: "NO_API",
    };
  }
};

// Fonction pour tester le diagnostic complet
export const testDiagnostic = async () => {
  try {
    console.log("🔍 Test de diagnostic complet...");
    const response = await axios.get(
      "/gestionadminastration/us-central1/api/v1/diagnostic",
      {
        timeout: 10000,
      },
    );
    console.log("✅ Diagnostic complet:", response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("❌ Diagnostic échoué:", error.message);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
};

// Test automatique de connectivité au chargement avec gestion d'erreur améliorée
if (typeof window !== "undefined") {
  setTimeout(async () => {
    const result = await testConnectivity();
    if (!result.success) {
      console.warn(
        "⚠️ Émulateur non accessible. Vérifiez que Firebase Emulator est démarré.",
      );
      console.log("💡 Solutions possibles:");
      console.log("   - Vérifiez la connexion internet");
      console.log("   - Relancez les émulateurs (firebase emulators:start)");
    }
  }, 1000);
}

export default axiosInstance;
