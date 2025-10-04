import axios, { AxiosHeaders, type AxiosRequestHeaders } from "axios";

// Configuration de l'URL de base
// En développement : utilise le proxy Vite
// En production : utilise VITE_API_BASE_URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/gestionadminastration/us-central1/api/v1";

// Forcer l'utilisation du proxy en développement
const isDevelopment = import.meta.env.DEV;
const finalBaseURL = isDevelopment ? "/gestionadminastration/us-central1/api/v1" : API_BASE_URL;

const axiosInstance = axios.create({
  baseURL: finalBaseURL,
  // Do not force a global Content-Type header here. Some requests (FormData) must let the browser set the proper multipart boundary.
  withCredentials: false,
  timeout: 10000, // 10 secondes de timeout pour les émulateurs
  retry: 3, // Nombre de tentatives
  retryDelay: 1000, // Délai entre les tentatives
});

// Log pour diagnostiquer les problèmes de connexion
console.log("API Base URL:", finalBaseURL);
console.log("Mode développement:", isDevelopment);
console.log("VITE_API_BASE_URL:", import.meta.env.VITE_API_BASE_URL);

// (removed duplicate simple request interceptor)

// Function to get new access token using refresh token
export const refreshAccessToken = async () => {
  try {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }
    // Assume a refresh token endpoint exists at /auth/refresh-token
    const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
      refreshToken,
    });
    // Backend renvoie { data: { accessToken, refreshToken } }
    const { accessToken, refreshToken: refreshedToken } = response.data.data;
    localStorage.setItem("token", accessToken); // Update access token
    if (refreshedToken) {
      localStorage.setItem("refreshToken", refreshedToken); // Update refresh token if rotated
    }
    return accessToken;
  } catch (error) {
    console.error("Error refreshing access token:", error);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
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
    
    const token = localStorage.getItem("token");
    console.log(
      "Frontend Interceptor - Retrieved Token:",
      token ? "Token exists" : "No token"
    );
    if (token) {
      // Ensure headers exist and set Authorization in a type-safe way
      if (!config.headers) {
        config.headers = new AxiosHeaders() as unknown as AxiosRequestHeaders;
      }
      if (config.headers instanceof AxiosHeaders) {
        (config.headers as AxiosHeaders).set(
          "Authorization",
          `Bearer ${token}`
        );
      } else {
        (config.headers as unknown as Record<string, string>)[
          "Authorization"
        ] = `Bearer ${token}`;
      }
      console.log(
        "Frontend Interceptor - Setting Authorization header:",
        (config.headers as Record<string, string>)["Authorization"]
      );
    }
    // No cookies/session-based auth; keep credentials disabled
    config.withCredentials = false;
    
    // Ajouter un timestamp pour éviter le cache
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      };
    }
    
    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
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
      timeout: error.code === 'ECONNABORTED'
    });
    
    // Gérer les timeouts et erreurs de connexion
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.log("⏰ Timeout détecté, vérification de l'émulateur...");
      
      // Tester la connectivité avant de retenter
      const connectivity = await testConnectivity();
      if (!connectivity.success) {
        console.error("❌ Émulateur non accessible, arrêt des tentatives");
        return Promise.reject(new Error("Émulateur Firebase non accessible. Vérifiez que l'émulateur est démarré."));
      }
      
      console.log("✅ Émulateur accessible, retry de la requête...");
      // Attendre un peu avant de retenter
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    const originalRequest = error.config;
    const status = error.response?.status;
    const data = error.response?.data || {};
    const code = (data && (data.code || data.error?.code)) || "";
    const message = (data && (data.message || data.error)) || "";

    // Déconnexion immédiate si le backend indique un token expiré ou un compte inactif
    if (
      (status === 401 || status === 403) &&
      (code === "TOKEN_EXPIRED" || code === "ACCOUNT_INACTIVE" || /token\s*expir/i.test(String(message)))
    ) {
      try {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
      } finally {
        if (window.location.pathname !== "/login") {
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
  }
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
  data?: Record<string, unknown>
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

// Fonction pour tester la connectivité avec l'émulateur
export const testConnectivity = async () => {
  const endpoints = [
    "/gestionadminastration/us-central1/api/v1/health",
    "http://127.0.0.1:5001/gestionadminastration/us-central1/api/v1/health",
    "http://localhost:5001/gestionadminastration/us-central1/api/v1/health"
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 Test de connectivité vers: ${endpoint}`);
      const response = await axios.get(endpoint, {
        timeout: 3000
      });
      console.log("✅ Émulateur accessible:", response.status);
      return { success: true, status: response.status, data: response.data, endpoint };
    } catch (error) {
      console.log(`❌ Échec pour ${endpoint}:`, error.message);
      continue;
    }
  }
  
  console.error("❌ Aucun émulateur accessible");
  return { 
    success: false, 
    error: "Aucun émulateur Firebase accessible", 
    code: 'NO_EMULATOR',
    suggestions: [
      "Vérifiez que l'émulateur Firebase est démarré",
      "Exécutez: firebase emulators:start",
      "Vérifiez le port 5001",
      "Vérifiez la configuration Firebase"
    ]
  };
};

// Fonction pour tester le diagnostic complet
export const testDiagnostic = async () => {
  try {
    console.log("🔍 Test de diagnostic complet...");
    const response = await axios.get("/gestionadminastration/us-central1/api/v1/diagnostic", {
      timeout: 10000
    });
    console.log("✅ Diagnostic complet:", response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("❌ Diagnostic échoué:", error.message);
    return { 
      success: false, 
      error: error.message, 
      code: error.code 
    };
  }
};

// Test automatique de connectivité au chargement avec gestion d'erreur améliorée
if (typeof window !== 'undefined') {
  setTimeout(async () => {
    const result = await testConnectivity();
    if (!result.success) {
      console.warn("⚠️ Émulateur non accessible. Vérifiez que Firebase Emulator est démarré.");
      console.log("💡 Solutions possibles:");
      result.suggestions?.forEach(suggestion => console.log(`   - ${suggestion}`));
    }
  }, 1000);
}

export default axiosInstance;
