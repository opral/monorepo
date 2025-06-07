import { defineConfig } from '@solidjs/start/config';
import { paraglideVitePlugin } from '@inlang/paraglide-js';

export default defineConfig({
  middleware: 'src/middleware/index.ts',
  vite: {
    plugins: [
      paraglideVitePlugin({
        project: './project.inlang',
        outdir: './src/paraglide',
        strategy: ["url", "cookie", "preferredLanguage", "baseLocale"],
        urlPatterns: [
          {
            pattern: "/about",
            localized: [
              ["en", "/en/about"],
              ["de", "/de/ueber-uns"],
            ],
          },
          {
            pattern: "/:path(.*)?",
            localized: [
              ["en", "/en/:path(.*)?"],
              ["de", "/de/:path(.*)?"],
            ],
          }
        ]
      })
    ]
  }
});
