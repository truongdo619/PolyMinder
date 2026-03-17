import { defineConfig } from "vite";
import reactRefresh from "@vitejs/plugin-react";

export default defineConfig({
  base: "/",
  build: {
    target: "esnext",
    outDir: "dist",
    sourcemap: "hidden",
    rollupOptions: {
      output: {
        manualChunks: {
          "pdf-viewer": ["pdfjs-dist"],
          "vis": ["vis-network/standalone"],
          "mui-core": ["@mui/material", "@mui/icons-material"],
          "data-grid": ["@mui/x-data-grid-pro"],
        },
      },
    },
  },
  assetsInclude: ["**/*.PNG", "**/*.JPG", "**/*.JPEG"],
  plugins: [reactRefresh()],
  server: {
    host: "0.0.0.0",
    port: 3002,
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "esnext",
    },
  },
  define: {
    APP_VERSION: JSON.stringify(process.env.npm_package_version),
  },
});
