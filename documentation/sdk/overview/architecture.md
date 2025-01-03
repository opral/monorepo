---
imports: 
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-links.js
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-link.js
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-figure.js
---

# Architecture

Inlang's architecture consists of four main components:

1. [Applications](/documentation/concept/app) - Provide users with an interface for their projects.
2. [SDK](/documentation) - Can be used by developers to build inlang apps.
3. [Project file](/documentation/concept/project) - Defines the project's settings, which language tags exists and to be imported modules.
4. [Modules](/documentation/plugin) - Contain plugins and/or lint rules that define the behavior of a project.

![inlang architecture](https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/documentation/sdk/assets/architecture.jpg)

<doc-links>
    <doc-link title="Guides are in the Marketplace" icon="material-symbols:add-business-outline-rounded" href="/" description="These docs guide you on how to build on top of inlang. You find guides in the marketplace"></doc-link>
</doc-links>

## What is inlang?

Inlang is globalization infrastructure that powers an ecosystem of apps, plugins, and solutions that make globalization simple.

![inlang ecosystem](https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/documentation/sdk/assets/ecosystem.jpg)

### Infrastructure approach

For every use case, there is an app, a plugin, a lint rule, or a custom solution that can be built. Inlang's infrastructure powers an ecosystem of tools, applications, best practices, and automations for organizations to go global.

<doc-figure src="https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/documentation/sdk/assets/project.jpg" alt="one config file to power all infrastructure tools" caption="Sketch about the concept of one configuration file that powers all tools, automation, and applications for globalization that developers build on top of."></doc-figure>

### Version control and automation via CI/CD

Inlang apps are built on lix. Lix is a git-compatible version control backend for applications. Using lix provides inlang with CI/CD for globalization and collaboration between developers, translators, and designers on one common source of truth: your repository and your data.

<doc-figure src="https://github.com/opral/monorepo/assets/58360188/917cc987-669d-4203-a2ed-8184087fd070" alt="lix-based globalization infrastructure" caption="Lix repositories act as building blocks for tools, applications like the editor, and automation via CI/CD."></doc-figure>
