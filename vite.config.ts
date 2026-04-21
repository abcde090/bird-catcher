import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Deployed to GitHub Pages at https://abcde090.github.io/bird-catcher/.
// Override via VITE_BASE (e.g. `VITE_BASE=/ npm run build`) for root-hosted
// deploys.
const base = process.env.VITE_BASE ?? "/bird-catcher/";

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
});
