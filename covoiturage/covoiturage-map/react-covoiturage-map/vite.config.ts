import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    // deno.json serves this directory on Deno Deploy — keep the CRA name
    outDir: "build",
  },
});
