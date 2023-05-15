---
# the frontmatter is only relevant for rendering this site on the website
title: Contributing
href: /documentation/contributing
description: Learn on how to contribute to inlang.
---

# Contributing

Inlang is setup as monorepo with NPM workspaces and [turborepo](https://turbo.build/).

Furthermore, the repository makes use of [Dev Containers](https://containers.dev/) ensuring that everyone works in the same environment. If you don't use dev containers, we won't be able to support dev related setup problems. 

## Getting started

0.1. Install [Docker](https://www.docker.com/)
0.2. Install the [VSCode DevContainers Extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
1. Open the repository in VSCode.
2. Open the repository in a dev container via `CMD + Shift + P` and search for `Open in container`. Make sure to allocate enough memory in your Docker setup (>4GB).
3. `npm install` to install dependencies
4. `npm run dev` to run the development environment.
5. `npm run test` to run the tests.
6. `npm run build` to compile a production build.

### For Windows users

There is a problem with Hot Module Reloading (HMR) within the Windows file system. To fix this problem, you can use the Linux subsystem:

1. Start the dev container first
2. Navigate to the Linux subsystem with `cd $HOME` & `cd /mnt`.
3. Clone the inlang repo into the Linux subsystem
4. Navigate to the inlang repo
5. Run `npm install` & `npm run dev`

**Note:**
Make sure that the user has the right to edit files.
For Docker Desktop, the user should be `node`.

## Debugging

1. Run `npm run dev`.
2. Several debug launch configs can be found in the VSCode sidemenu.
