import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["../lix-sdk/src/index.ts"], // SDK entry point
    treeshake: true,
    minify: false, // Keep readable for debugging
    verbose: true,
    dts: true,
    format: ["esm"], // ES modules format
    external: [], // Bundle everything for SandPack
    clean: true,
    outDir: "./docs/public", // build output for sandpack
    outExtension: () => ({ js: ".js" }), // ensure .js extension
    target: "es2018", // Target ES2018 for Babel 6.26 compatibility
    onSuccess: async () => {
      // Copy the built file to the expected name
      const fs = await import('fs');
      const path = await import('path');
      const { fileURLToPath } = await import('url');
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const srcPath = path.join(__dirname, 'docs/public/index.js');
      const destPath = path.join(__dirname, 'docs/public/lix-sdk-bundle.js');
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log('✅ SDK bundle copied to lix-sdk-bundle.js');
      }
    }
  },
]);