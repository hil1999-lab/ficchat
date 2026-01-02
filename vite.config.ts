import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Vite config for static hosting.
 * - `base: './'` keeps asset URLs relative, which is safer across static hosts.
 * - No env injection / API keys.
 */
export default defineConfig({
  base: "./",
  plugins: [react()],
  server: {
    port: 3000,
    host: "0.0.0.0",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
