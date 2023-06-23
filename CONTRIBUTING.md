---
# the frontmatter is only relevant for rendering this site on the website
title: Contributing
href: /documentation/contributing
description: Learn on how to contribute to inlang.
---

# Contributing

Inlang is setup as [monorepo](https://monorepo.tools/) with NPM workspaces and [turborepo](https://turbo.build/).

Furthermore, the repository makes use of [Dev Containers](https://containers.dev/) ensuring that everyone works in the same environment. If you don't use dev containers, we won't be able to support dev related setup problems.

## Getting started

Make sure you have [Git](https://git-scm.com/), [Docker](https://www.docker.com/), [Visual Studio Code](https://code.visualstudio.com/) and the [VSCode DevContainers Extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) installed. Provide your Docker setup plenty of memory (>4GB). If you are a Windows user, please read the subsection below.

1. Clone the inlangs repository.
2. Open the repository folder in Visual Studio Code.
3. Run `Dev Containers: Reopen in Container` via `CTRL + Shift + P` or `⌘ + Shift + P`.
4. `npm install` to install dependencies
5. `npm run dev` to run the development environment.
6. `npm run test` to run the tests.
7. `npm run build` to compile a production build.

### For Windows users

Install [Windows Subsystem Linux 2 (WSL 2)](https://learn.microsoft.com/en-us/windows/wsl/install) as well. Make sure that the user has the right to edit files. For Docker Desktop, the user should be `node`.

1. Start Visual Studio Code.
2. Run `Dev Containers: Clone Repository in Container Volume...` via `CTRL + Shift + P`.
3. `npm install` to install dependencies
4. `npm run dev` to run the development environment.
5. `npm run test` to run the tests.
6. `npm run build` to compile a production build.

## Debugging

1. Run `npm run dev`.
2. Several debug launch configs can be found in the VSCode sidemenu.
