import * as path from 'node:path';
import { defineConfig } from 'rspress/config';

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  title: 'Lix HTML Diff',
  description: 'Build a diff view in your app with this HTML differ',
  icon: '/rspress-icon.png',
  logo: {
    light: '/rspress-light-logo.png',
    dark: '/rspress-dark-logo.png',
  },
  globalStyles: path.join(__dirname, 'docs/styles/index.css'),
  builderConfig: {
    tools: {
      rspack: {
        module: {
          rules: [
            {
              resourceQuery: /raw/,
              type: 'asset/source',
            },
          ],
        },
      },
    },
  },
  themeConfig: {
    darkMode: false,
    nav: [
      {
        text: 'Guide',
        link: '/guide/',
      },
      {
        text: 'Showcase',
        link: '/showcase/rich-text-document/',
      },
      {
        text: 'Playground',
        link: '/playground',
      },
      {
        text: 'Test Cases',
        link: '/test-cases',
      },
    ],
    sidebar: {
      '/showcase/': [
        {
          text: 'Rich Text Document',
          link: '/showcase/rich-text-document/',
        },
      ],
    },
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/opral/monorepo/tree/main/packages/lix/lix-html-diff',
      },
    ],
  },
});
