---
title: Introduction
href: /documentation
description: Learn how to get started with inlang, the design principles, and more.
---

# {% $frontmatter.title %}

{% QuickLinks %}

    {% QuickLink
        title="Quickstart"
        icon="fast"
        href="/documentation/quick-start"
        description="Setup inlang for a globalized project."
    /%}

    {% QuickLink
        title="Plugins"
        icon="add-plugin"
        href="/documentation/plugins/registry"
        description="Extend inlang to fit your needs."
    /%}

    {% QuickLink
        title="SDKs"
        icon="code"
        href="/documentation/sdk/overview"
        description="Start with an SDK if you are not globalizing yet."
    /%}

{% /QuickLinks %}

{% Video src="https://www.youtube.com/embed/mB2-Ze-SjXE?rel=0" / %}

## What is inlang?

inlang (pronounced /Ínlang/) is localization that consists of extendable tools and apps to make localization of software simple. It uses a versioned backend that allows for efficient collaboartion between developers, translators or designers.

### Git-compatible, infrastructure, and developer-first.

All tools and applications that inlang provides are built on Git, the version control, automation and collaboration system used by software engineers.

The automation and collaboration power a version control system provides might just be what could make localization _substantially_ easier, if not any kind of content based workflow. Read more about the rationale in [git as an SDK](/blog/git-as-sdk).

{% Figure

    src="https://github.com/inlang/inlang/assets/58360188/917cc987-669d-4203-a2ed-8184087fd070"

    alt="git-based localization infrastructure"

    caption="Git repositories act as building block for tools, applications like the editor and automation via CI/CD."

/%}

## Infrastructure Approach

Inlang is designed to enable developers to build on top of inlang to suit their needs.

Localization is too complicated and involves too many stakeholders to be solvable with one single solution. It needs a variety of solutions for developers, translators, product-managers, business owners, static site, dynamic apps, etc.

{% Figure

    src="https://github.com/inlang/inlang/assets/58360188/55c61841-ab73-4fa8-a828-3c2016ced872"

    alt="one config file to power all infrastructure tools"

    caption="Sketch about the concept of one configuration file that powers all tools, automations and applications for localization that developers build on top of."

/%}

## Developer First

Localization (of software) starts and ends with developers. Yet, most existing solutions leave out the individiual developer experience when working on a localized codebase.

We are building tools that increases the developer experience in the context of localization because we experienced the struggles first-hand. Simple things like typesafety, CI/CD pipelines, and warnings during development are oftentimes missing. Long story short, dev tools are missing and required to make localization easier, so we are building them.

{% Figure

    src="https://cdn.jsdelivr.net/gh/inlang/inlang/assets/ide-extension/extract.gif"

    alt="inlang ide extension"

    caption="The IDE extension is an example of the developer first approach."

/%}

{% QuickLinks %}

    {% QuickLink
        title="Setup your config now"
        icon="fast"
        href="/documentation/quick-start"
        description="Setup inlang for a localized project."
    /%}

{% /QuickLinks %}
