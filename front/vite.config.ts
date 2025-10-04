import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Configuration pour le routage SPA (Single Page Application)
    historyApiFallback: true,
    proxy: {
      // Proxy les appels API vers l'émulateur Firebase Functions
      "/gestionadminastration": {
        target: "http://127.0.0.1:5001",
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('❌ Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('🚀 Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('✅ Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(
    Boolean
  ),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
