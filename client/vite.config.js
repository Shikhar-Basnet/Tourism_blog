// client/vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.VITE_DOCKER_PROXY_TARGET || "http://localhost:5000",
        changeOrigin: true,
      },
      "/uploads": process.env.VITE_DOCKER_PROXY_TARGET || "http://localhost:5000",
    },
  },
});