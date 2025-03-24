import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@lix-js/sdk': resolve(__dirname, '../..', 'lix-sdk/dist/index.js'),
      '@lix-js/plugin-json': resolve(__dirname, '../..', 'lix-plugin-json/dist/index.js'),
      '@lix-js/inspector': resolve(__dirname, '..', 'dist/index.js'),
    },
  },
  server: {
    port: 3000,
  },
});