import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    nodePolyfills(),
    svelte()
  ],
  build: {
    minify: false,
    rollupOptions: {
      external: ['vite-plugin-node-polyfills/shims/process', 'vite-plugin-node-polyfills/shims/buffer']
    } 
  },
  server: {
    host: '0.0.0.0',
    port: 3334,
    // proxy: {
    //   '/git-proxy': {
    //     target: 'http://josh:8000',
    //     changeOrigin: true,
    //     rewrite: (path) => path.replace('/git-proxy/josh.local/', '/'),
    //     configure: (proxy, options) => {
    //       proxy.on('proxyReq', async (proxyReq, req, res) => {

    //         // console.log(await fetch('http://josh.local'))
    //         // console.log('Sending Request to the Target:', res)// req.method, req, proxyReq);
    //         // throw new Error('test');
    //       });
    //     },
    //   },
    //   // '/github-proxy': {
    //   //   target: 'http://localhost:3001',
    //   //   changeOrigin: true,
    //   //   configure: (proxy, options) => {
    //   //     proxy.on('proxyReq', (proxyReq, req, _res) => {
    //   //       // console.log('Sending Request to the Target:', req.method, req.url);
    //   //     });
    //   //   },
    //   // },
    // }
  }
})
