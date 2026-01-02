# Refactoring Inlang

![architecture inlang new](https://cdn.jsdelivr.net/gh/opral/inlang/documentation/sdk/assets/architecture.jpg)

## Architecture

- New capabilities for the ecosystem by changing the config format from JS to JSON.
  - Apps can now perform CRUD operations to add modules, change language tags, and more.
- The new concept of a “Project”.
  - Everything inlang related like messages, lints, installed plugins, etc. is now bundled in a project.
  - Foundation to support multiple projects like iOS and Android apps in one repository in the future.
- Building inlang apps got substantially easier with a new inlang SDK.
  - `loadProject` is the new entry point that bundles query, linting, module resolution, and more in one function.
  - Reactive by default, which auto updates your apps.
- New message format with variants that enable any advanced use case.
  - Pluralization
  - Gender
  - A/B testing
  - And more
- Developing message lint rules and plugins became simpler.
  - A default export is all you need.
  - You can use the CLI to build plugins and lint rules. No more custom esbuild config.

## Editor

- Realtime linting and message update
- Autosaving for faster workflows

## Visual Studio Code extension (Sherlock)

- Faster startup time & Realtime linting and message update
- Auto migration of inlang.config.js to project.inlang.json
- Better error handling

## Marketplace

![inlang marketplace](https://cdn.jsdelivr.net/gh/opral/inlang/documentation/sdk/assets/marketplace.jpg)

- Find apps, libraries and modules for your project
- Have the opportunity to distribute your own inlang-based product
- Install modules directly from the store

## CLI

- Performance improvements
- New command “project migrate” to easily migrate your config file to json.
- New command “module init” & “module build” to simplify module development

## Lix (former Project Lisa)

- We finally gave our library for data fetching and versioning “Project Lisa” a real name: lix
- Lix will be git-compatible but light weight and support lazy operations. It will be the foundation for inlang apps
- With lix, our vision is to build a revamped version control system that is built for the web and with UX & DX in mind. This will bring a lot of improvements & benefits to our ecosystem and we can’t wait to show more

## Paraglide JS (former SDK-JS)

- Ivan Hofer passed away, the project lead of the sdk-js
- The sdk-js will be renamed to paraglide js, a major hobby of Ivan Hofer
- We decided to refrain from a refactor of the sdk-js due to
  1. double migration risk
  2. the refactor might break existing apps
- The team invested multiple days into getting the sdk-js running with the new architecture. However, we are not confident that we are not going to break existing apps
- As long as you keep your inlang.config.js, the sdk-js should work as expected.
- We are working with “hochdruck” (high pressure) on providing a stable paraglide js library
- Dominik Göpel continues working on built-in capabilities for SvelteKit i18n routing
