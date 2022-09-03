import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import ssr from "vite-plugin-ssr/plugin";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";

export default defineConfig({
  plugins: [solidPlugin({ ssr: true }), ssr()],
  server: {
    port: 3002,
  },
  build: {
    target: "esnext",
  },
  optimizeDeps: {
    // lightning-fs and/or isomorphic-git require node polyfills
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: "globalThis",
      },
      // Buffer polyfill
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true,
        }),
      ],
    },
  },
});
