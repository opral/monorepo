# What is inlang?

**inlang** is globalization infrastructure that powers an ecosystem of inlang apps, plugins and solutions that make globalization simple.

![Go global mockups](https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/documentation/ecosystem/assets/go-global-mockup02.png)

<br/>

---

## Ecosystem Approach

![Project directory](https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/documentation/ecosystem/assets/file-and-apps.png)

For every use case, there is an app, a plugin, a lint rule, or a custom solution that can be built. Once you have set up your inlang project, you can use all of them without any additional effort.

<br/>

<doc-links>
    <doc-link title="Project directory (file)" icon="mdi:file-outline" href="/documentation/concept/project" description="Learn about the inlang project."></doc-link>
    <doc-link title="inlang Apps" icon="mdi:apps" href="/c/apps" description="Discover the inlang apps."></doc-link>
</doc-links>

<br/>

---

## Using repositories as a backend

inlang apps are built on lix. Lix is a git-compatible version control backend for your software projects. Using lix provides inlang with CI/CD for globalization and collaboration between developers, translators, and designers on one common source of truth: **Your repository and your data**.

![change control with lix](https://github.com/opral/monorepo/assets/58360188/917cc987-669d-4203-a2ed-8184087fd070)

What you get with this approach:

- **Quality management** - Define [Lint Rules](/documentation/lint-rule) for your project to ship quality cross-app.
- **Automations** - With lix change control you can use CI/CD to check lint, machine translate, validate and more. (Continuous Localization)
- **Review** - PR workflows can be used to gain control over the merged content.

<br/>

<doc-links>
    <doc-link title="inlang architecture" icon="mdi:skip-next" href="/documentation/architecture" description="Learn more about inlangs architecture."></doc-link>
</doc-links>

<br/>
<br/>
<br/>
