import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        entryFileNames: "assets/monument-app.js",
        chunkFileNames: "assets/monument-[name].js",
        assetFileNames: (info) => {
          if (info.name && String(info.name).endsWith(".css")) {
            return "assets/monument-app.css";
          }
          return "assets/monument-[name][extname]";
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5001",
        changeOrigin: true,
      },
    },
  },
});
