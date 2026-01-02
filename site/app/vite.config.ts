import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import million from "million/compiler";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  base: "/xldx",
  builder: "rolldown",
  plugins: [million.vite({ auto: true }), react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
          router: ["@tanstack/react-router"],
          query: ["@tanstack/react-query"],
        },
      },
    },
  },
});
