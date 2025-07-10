import * as path from 'node:path';
import { defineConfig } from 'rspress/config';
import mermaid from 'rspress-plugin-mermaid';

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  title: 'Lix HTML Diff',
  description: 'Build a diff view in your app with this HTML differ',
  icon: '/rspress-icon.png',
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
  plugins: [mermaid()],
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
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            {
              text: 'Getting Started',
              link: '/guide/',
            },
            {
              text: 'Why HTML Diff?',
              link: '/guide/why-html-diff',
            },
            {
              text: 'Limitations',
              link: '/guide/limitations',
            },
          ],
        },
        {
          text: 'Guide',
          items: [
            {
              text: 'Attributes',
              link: '/guide/attributes',
            },
            {
              text: 'Styling',
              link: '/guide/styling',
            },
            {
              text: 'Contributing',
              link: '/guide/contributing',
            },
          ],
        },
      ],
      '/showcase/': [
        {
          text: 'Rich Text Document',
          link: '/showcase/rich-text-document/',
        },
      ],
      '/test-cases': [
        {
          text: 'data-diff-key',
          link: '/test-cases#data-diff-key',
        },
        {
          text: 'data-diff-words',
          link: '/test-cases#data-diff-words',
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
