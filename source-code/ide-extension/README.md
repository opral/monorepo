<div>
    <p align="center">
        <img width="300" src="https://raw.githubusercontent.com/inlang/inlang/main/apps/vs-code-extension/assets/readme-logo.png"/>
    </p>
    <h2 align="center">
        Open Source Localization Solution for Software
    </h2>
    <h3 align="center">
        <a href="https://inlang.dev" target="_blank">Website</a> · <a href="https://github.com/inlang/inlang" target="_blank">GitHub</a> · <a href="https://inlang.dev/docs/intro" target="_blank">Documentation</a> 
    </h3>
</div>

# Inlang VS Code Extension

The VS Code extension is part of the open-source localization solution [inlang](https://www.inlang.dev/).

## Getting Started

Create an `inlang.config.json` file in your project.

- Either run `npx @inlang/cli init` in the terminal (but node must be installed).
- Or manually create the JSON config:  
  For an example and the config schema, go to the [config reference](https://inlang.dev/docs/reference/config).

## Features

### Inline Annotations

See translations directly in your code. No more back-and-forth looking into the translation files themselves.

![inline annotations](https://raw.githubusercontent.com/inlang/inlang/main/apps/vs-code-extension/assets/inline-annotation.png)

### Extract Messages (translations)

Extract Messages (translations) via the `Inlang: Extract Message` code action.

![extract message](https://raw.githubusercontent.com/inlang/inlang/main/apps/vs-code-extension/assets/extract-pattern.gif)
