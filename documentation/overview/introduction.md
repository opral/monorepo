---
title: Introduction
href: /documentation
description: Inlang is globalization infrastructure that powers an ecosystem of apps, plugins, and solutions that make globalization simple.
---

# {% $frontmatter.title %}

## What is inlang?

{% $frontmatter.description %}

![inlang ecosystem](https://cdn.jsdelivr.net/gh/inlang/monorepo/inlang/documentation/assets/ecosystem.jpg)

### Infrastructure approach

For every use case, there is an app, a plugin, a lint rule, or a custom solution that can be built. Inlang's infrastructure powers an ecosystem of tools, applications, best practices, and automations for organizations to go global.

{% Figure
src="https://cdn.jsdelivr.net/gh/inlang/monorepo/inlang/documentation/assets/project.jpg"
alt="one config file to power all infrastructure tools"
caption="Sketch about the concept of one configuration file that powers all tools, automation, and applications for globalization that developers build on top of."

/%}

### Version control and automation via CI/CD

Inlang apps are built on lix. Lix is a git-compatible version control backend for applications. Using lix provides inlang with CI/CD for globalization and collaboration between developers, translators, and designers on one common source of truth: your repository and your data.

{% Figure

    src="https://github.com/inlang/monorepo/assets/58360188/917cc987-669d-4203-a2ed-8184087fd070"

    alt="lix-based globalization infrastructure"

    caption="Lix repositories act as building blocks for tools, applications like the editor, and automation via CI/CD."

/%}

{% QuickLinks %}

    {% QuickLink
        title="Getting started"
        icon="fast"
        href="/documentation/manually-create-project"
        description="Create a new project."
    /%}

    {% QuickLink
        title="Marketplace"
        icon="add-plugin"
        href="/marketplace"
        description="Find apps, plugins, and lint rules."
    /%}

{% /QuickLinks %}
