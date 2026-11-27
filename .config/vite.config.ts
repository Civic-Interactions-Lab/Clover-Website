import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { execSync } from "child_process";
import pkg from "../package.json";

const commitHash = (() => {
  try {
    return execSync("git rev-parse --short HEAD", {
      stdio: ["ignore", "pipe", "ignore"],
    }).toString().trim();
  } catch {
    return process.env.VITE_COMMIT_HASH || "local";
  }
})();
const version = pkg.version;

// https://vite.dev/config/
export default defineConfig({
  base: "/",
  root: ".",
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: "CNAME",
          dest: ".",
        },
      ],
    }),
  ],
  define: {
    __COMMIT_HASH__: JSON.stringify(commitHash),
    __APP_VERSION__: JSON.stringify(version),
  },
  server: {
    host: "::",
    port: 5173,
    allowedHosts: ["clover.nickrucinski.com", "clovercode.test", "127.0.0.1.nip.io"], // Allow your domain and local study preview
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "../src"),
    },
  },
  css: {
    postcss: path.resolve(__dirname, "./postcss.config.js"), // 👈 point to postcss
  },
});
