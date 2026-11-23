import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  publicDir: false,
  resolve: {
    alias: {
      "@shared": resolve(__dirname, "src/shared"),
      "@content": resolve(__dirname, "src/content")
    }
  },
  build: {
    outDir: "dist/background",
    emptyOutDir: false,
    sourcemap: false,
    lib: {
      entry: resolve(__dirname, "src/background/index.ts"),
      name: "ForeverEditBackground",
      formats: ["iife"],
      fileName: () => "background.js"
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true
      }
    }
  }
});
