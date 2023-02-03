---
# the frontmatter is only relevant for rendering this site on the website
title: Contributing
description: Learn on how to contribute to inlang.
href: /documentation/contributing
---

# Contributing

Inlang is setup as monorepo with [turborepo](https://turbo.build/) and NPM workspaces.

## Development

1. **Fork** the project on Github
2. **Open** the freshly cloned project with Visual Studio Code and [Remote Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers).
3. **Install** the projects dependencies with `npm install`.
4. **Run** the tests with `npm test`.
5. **Create** a branch for your new feature or improvement.
6. **Debug** and write tests for your changes.
   - Use the preconfigured launch scripts in Visual Studio Codes `Run and Debug` view.
7. **Contribute** your changes via a upstream pull request.

### Workspaces

#### `ide-extension`

- Launch `debug ide-extension` via Visual Studio Codes `Run and Debug` view to debug the extension with it's example project.
- Launch `debug ide-exension tests` via Visual Studio Codes `Run and Debug` view to debug the extensions tests.
