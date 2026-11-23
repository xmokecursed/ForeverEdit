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
    outDir: "dist/content",
    emptyOutDir: false,
    sourcemap: false,
    lib: {
      entry: resolve(__dirname, "src/content/index.ts"),
      name: "ForeverEditContent",
      formats: ["iife"],
      fileName: () => "content.js"
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true
      }
    }
  }
});
