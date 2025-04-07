/**
 * Special build for library mode.
 */
import { defineConfig } from "vite";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { plugins } from "./vite.config";
import dts from "vite-plugin-dts";
import path from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    ...plugins,
    dts({
      include: ["src/index.tsx"],
    }),
  ],
  build: {
    minify: false,
    target: "es2022",
    lib: {
      entry: resolve(__dirname, "src/index.tsx"),
      formats: ["es"],
      fileName: "index",
      cssFileName: "styles",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
