import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// Project layout (relative to this file):
//   ./src                  — frontend source
//   ../shared/data         — data shared with backend
//   ../shared/lib          — pure utilities shared with backend
//   ../backend/api         — Vercel serverless functions (not built by Vite)
//
// Path-alias rules used in source code:
//   @/components/*  → ./src/components/*
//   @/hooks/*       → ./src/hooks/*
//   @/pages/*       → ./src/pages/*
//   @/lib/*         → ../shared/lib/*       (browser-safe utils)
//   @/data/*        → ../shared/data/*      (programs, products, seedBlogs, …)
//   @/*             → ./src/*               (catch-all)
export default defineConfig({
  // The frontend directory is the Vite project root: index.html lives here.
  root: __dirname,
  // .env files live at the repo root, alongside package.json — not inside frontend/.
  envDir: path.resolve(__dirname, ".."),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      {
        find: /^@\/components\/(.*)$/,
        replacement: path.resolve(__dirname, "src/components/$1"),
      },
      {
        find: /^@\/hooks\/(.*)$/,
        replacement: path.resolve(__dirname, "src/hooks/$1"),
      },
      {
        find: /^@\/pages\/(.*)$/,
        replacement: path.resolve(__dirname, "src/pages/$1"),
      },
      {
        find: /^@\/lib\/(.*)$/,
        replacement: path.resolve(__dirname, "../shared/lib/$1"),
      },
      {
        find: /^@\/data\/(.*)$/,
        replacement: path.resolve(__dirname, "../shared/data/$1"),
      },
      { find: /^@\/(.*)$/, replacement: path.resolve(__dirname, "src/$1") },
    ],
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:8081",
        changeOrigin: true,
        secure: false,
      },
    },
    hmr: {
      host: "localhost",
      port: 3000,
      protocol: "ws",
    },
  },
  preview: {
    port: 3000,
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
});
