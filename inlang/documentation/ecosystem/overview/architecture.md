# Architecture

Inlang's architecture consists of three main components:

1. [inlang Apps](/documentation/concept/app) - Provide users with an interface for their projects.
2. [SDK](/documentation/sdk) - Can be used by developers to build inlang apps.
3. [Repository (Lix)](/#lix) - Defines the project's settings, which language tags exists and to be imported modules.

![inlang architecture](https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/documentation/sdk/assets/architecture.jpg)

### Infrastructure approach

For every use case, there is an app, a plugin, a lint rule, or a custom solution that can be built. Inlang's infrastructure powers an ecosystem of tools, applications, best practices, and automations for organizations to go global.

![inlang ecosystem](https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/documentation/sdk/assets/ecosystem.jpg)


### Version control and automation via CI/CD

Inlang apps are built on lix. Lix is a git-compatible version control backend for applications. Using lix provides inlang with CI/CD for globalization and collaboration between developers, translators, and designers on one common source of truth: your repository and your data.

<doc-figure src="https://github.com/opral/monorepo/assets/58360188/917cc987-669d-4203-a2ed-8184087fd070" alt="lix-based globalization infrastructure" caption="Lix repositories act as building blocks for tools, applications like the editor, and automation via CI/CD."></doc-figure>
