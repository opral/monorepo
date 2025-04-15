import React from "react";
// @ts-expect-error - Vite-specific import
import Readme from "../README.md?raw";

const highlightCss = `pre code.hljs{display:block;overflow-x:auto;padding:1em}code.hljs{padding:3px 5px}/*!\n  Theme: GitHub\n  Description: Light theme as seen on github.com\n  Author: github.com\n  Maintainer: @Hirse\n  Updated: 2021-05-15\n\n  Outdated base version: https://github.com/primer/github-syntax-light\n  Current colors taken from GitHub's CSS\n*/.hljs{color:#24292e;background:#fff}.hljs-doctag,.hljs-keyword,.hljs-meta .hljs-keyword,.hljs-template-tag,.hljs-template-variable,.hljs-type,.hljs-variable.language_{color:#d73a49}.hljs-title,.hljs-title.class_,.hljs-title.class_.inherited__,.hljs-title.function_{color:#6f42c1}.hljs-attr,.hljs-attribute,.hljs-literal,.hljs-meta,.hljs-number,.hljs-operator,.hljs-selector-attr,.hljs-selector-class,.hljs-selector-id,.hljs-variable{color:#005cc5}.hljs-meta .hljs-string,.hljs-regexp,.hljs-string{color:#032f62}.hljs-built_in,.hljs-symbol{color:#e36209}.hljs-code,.hljs-comment,.hljs-formula{color:#6a737d}.hljs-name,.hljs-quote,.hljs-selector-pseudo,.hljs-selector-tag{color:#22863a}.hljs-subst{color:#24292e}.hljs-section{color:#005cc5;font-weight:700}.hljs-bullet{color:#735c0f}.hljs-emphasis{color:#24292e;font-style:italic}.hljs-strong{color:#24292e;font-weight:700}.hljs-addition{color:#22863a;background-color:#f0fff4}.hljs-deletion{color:#b31d28;background-color:#ffeef0}`;

export function ReadmeHome() {
  return (
    <div className="max-w-3xl mx-auto my-8">
      <div
        dangerouslySetInnerHTML={{
          __html: `
            <zero-md>
              <template>
                <style>
                  :host {
                    --zm-accent: #0969da;
                    --zm-font-family: 'Inter', system-ui, sans-serif;
                  }
                </style>
               <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/styles/github.min.css">
              </template>
              <script type="text/markdown">\n${Readme.replace(/`/g, "\`")}\n</script>
            </zero-md>
          `,
        }}
      />
    </div>
  );
}
