// vite.config.ts
import { sveltekit } from "file:///Users/sigrist/dev/monorepo/node_modules/.pnpm/@sveltejs+kit@1.27.6_svelte@4.0.5_vite@4.5.0/node_modules/@sveltejs/kit/src/exports/vite/index.js";
import { paraglide } from "file:///Users/sigrist/dev/monorepo/inlang/source-code/paraglide/paraglide-js-adapter-sveltekit/dist/index.js";
import { defineConfig } from "file:///Users/sigrist/dev/monorepo/node_modules/.pnpm/vite@4.5.0_@types+node@20.10.0/node_modules/vite/dist/node/index.js";
var vite_config_default = defineConfig({
  plugins: [
    paraglide({
      project: "./project.inlang",
      outdir: "./src/paraglide",
      strategy: {
        name: "prefix",
        prefixDefault: false
      }
    }),
    sveltekit()
  ]
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvc2lncmlzdC9kZXYvbW9ub3JlcG8vaW5sYW5nL3NvdXJjZS1jb2RlL3BhcmFnbGlkZS9wYXJhZ2xpZGUtanMtYWRhcHRlci1zdmVsdGVraXQvZXhhbXBsZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL3NpZ3Jpc3QvZGV2L21vbm9yZXBvL2lubGFuZy9zb3VyY2UtY29kZS9wYXJhZ2xpZGUvcGFyYWdsaWRlLWpzLWFkYXB0ZXItc3ZlbHRla2l0L2V4YW1wbGUvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL3NpZ3Jpc3QvZGV2L21vbm9yZXBvL2lubGFuZy9zb3VyY2UtY29kZS9wYXJhZ2xpZGUvcGFyYWdsaWRlLWpzLWFkYXB0ZXItc3ZlbHRla2l0L2V4YW1wbGUvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBzdmVsdGVraXQgfSBmcm9tICdAc3ZlbHRlanMva2l0L3ZpdGUnO1xuaW1wb3J0IHsgcGFyYWdsaWRlIH0gZnJvbSBcIkBpbmxhbmcvcGFyYWdsaWRlLWpzLWFkYXB0ZXItc3ZlbHRla2l0XCJcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCJcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcblx0cGx1Z2luczogW1xuXHRcdHBhcmFnbGlkZSh7XG5cdFx0XHRwcm9qZWN0OiBcIi4vcHJvamVjdC5pbmxhbmdcIixcblx0XHRcdG91dGRpcjogXCIuL3NyYy9wYXJhZ2xpZGVcIixcblx0XHRcdHN0cmF0ZWd5OiB7XG5cdFx0XHRcdG5hbWU6IFwicHJlZml4XCIsXG5cdFx0XHRcdHByZWZpeERlZmF1bHQ6IGZhbHNlLFxuXHRcdFx0fSxcblx0XHR9KSxcblx0XHRzdmVsdGVraXQoKSxcblx0XSxcbn0pXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQStjLFNBQVMsaUJBQWlCO0FBQ3plLFNBQVMsaUJBQWlCO0FBQzFCLFNBQVMsb0JBQW9CO0FBRTdCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzNCLFNBQVM7QUFBQSxJQUNSLFVBQVU7QUFBQSxNQUNULFNBQVM7QUFBQSxNQUNULFFBQVE7QUFBQSxNQUNSLFVBQVU7QUFBQSxRQUNULE1BQU07QUFBQSxRQUNOLGVBQWU7QUFBQSxNQUNoQjtBQUFBLElBQ0QsQ0FBQztBQUFBLElBQ0QsVUFBVTtBQUFBLEVBQ1g7QUFDRCxDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
