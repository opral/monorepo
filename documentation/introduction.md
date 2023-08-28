---
title: Introduction
href: /documentation
description: Inlang is globalization infrastructure that powers an ecosystem of apps, plugins, and lint rules that simplifies going global for organizations.
---

# {% $frontmatter.title %}

## What is inlang?

{% $frontmatter.description %}

<!-- TODO illustration of inlang ecosystem -->

## Main features

### Infrastructure approach

For every use case, there is an app, a plugin, a lint rule, or a custom solution that can be built. Inlang's infrastructure powers an ecosystem of tools, applications, best practices, and automations for organizations to go global.

{% Figure
src="https://github.com/inlang/inlang/assets/58360188/55c61841-ab73-4fa8-a828-3c2016ced872"
alt="one config file to power all infrastructure tools"
caption="Sketch about the concept of one configuration file that powers all tools, automation, and applications for globalization that developers build on top of."

/%}

### Version control and automation via CI/CD

Inlang apps are built on lix. Lix is a git-compatible version control backend for applications. Using lix provides inlang with CI/CD for globalization and collaboration between developers, translators, and designers on one common source of truth: your repository and your data.

{% Figure

    src="https://github.com/inlang/inlang/assets/58360188/917cc987-669d-4203-a2ed-8184087fd070"

    alt="lix-based globalization infrastructure"

    caption="Lix repositories act as building blocks for tools, applications like the editor, and automation via CI/CD."

/%}
