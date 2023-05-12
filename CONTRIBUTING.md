---
# the frontmatter is only relevant for rendering this site on the website
title: Contributing
href: /documentation/contributing
description: Learn on how to contribute to inlang.
---

# Contributing

Inlang is setup as monorepo with [turborepo](https://turbo.build/) and NPM workspaces.

## Prerequisites

- [Docker](https://www.docker.com/)
- [VSCode](https://vscode.dev/)
- [VSCode extension: Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
- (If you are part of inlang, ask for access to doppler from private env variables.)

Note: 
Before going any further please install the recommended version of 
toolchain. Recommended version are `v.18.16.0` for `node` and `v.9.6.6` for `npm`.   
If you are using `volta` to manage your toolchain we have pinned the recommended
tooling version to the project.

## Getting started

1. Open the repository in VSCode.
2. Open the repository in a dev container via `CMD + Shift + P` and search for `Open in container`. Make sure to allocate enough memory in your Docker setup (4GB).
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

1. (If running, stop `npm run dev`.)
2. Press `F5`.
3. Wait until the terminal is showing "listening on localhost:3000".
4. Open "localhost:xxxx" in the browser.

## Contributing changes

1. **Fork** the project on Github.
2. **Open** the freshly cloned project with Visual Studio Code and [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers).
3. **Create** a branch for your new feature or improvement.
4. **Test** with `npm run test`.
5. **Debug** and write tests for your changes.
   - Use the preconfigured launch scripts in Visual Studio Codes `Run and Debug` view.
6. **Describe** your changes by running `npx changeset` and answering the questions. (learn more [here](https://github.com/changesets/changesets/blob/main/docs/adding-a-changeset.md#adding-a-changeset))
7. **Contribute** your changes via a upstream pull request.

### Workspaces

#### `ide-extension`

- Clone `https://github.com/inlang/example` into `source-code/ide-extension` for debugging with `git clone https://github.com/inlang/example source-code/ide-extension/example` and install dependencies `cd source-code/ide-extension/example && npm install`.
- Launch `debug ide-extension` via Visual Studio Codes `Run and Debug` view to debug the extension with it's example project, after you run the development environment with `npm run dev`.
- Launch `debug ide-exension tests` via Visual Studio Codes `Run and Debug` view to debug the extensions tests.
