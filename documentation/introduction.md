---
title: Introduction
href: /documentation
description: Learn on how to get started with inlang, the design principles, and more.
---

# {% $frontmatter.title %}


**Inlang is infrastructure that consists of extendable tools and apps to make localization simple.**
![Add Image](https://user-images.githubusercontent.com/72493222/229363134-13f95dad-d54e-4637-a946-d843877e4198.png)

{% Video src="https://youtu.be/KEKxHSkLD6Y" /%}

{% QuickLinks %}

    {% QuickLink
        title="Getting started"
        icon="turn-slight-left"
        href="/documentation/getting-started"
        description="Step-by-step guide to setting up inlang."
    /%}

    {% QuickLink
        title="Why inlang?"
        icon="architecture"
        href="/documentation/why-inlang"
        description="Learn how inlang is designed."
    /%}

    {% QuickLink
        title="Build on inlang"
        icon="construction"
        href="/documentation/build-on-inlang"
        description="Extend the library with third-party plugins or write your own."
    /%}

{% /QuickLinks %}

## Editor

Let non-technical team members (translators) manage messages in a repository. The editor is a baby of VSCode and Figma, combining a git based editor with a web-based and simple to use editor.

![the inlang editor to manage translations](https://cdn.jsdelivr.net/gh/inlang/inlang/assets/editor-example.png)

## Dev tools

Inlang is designed to be extended, the dev tools below are a small selection of dev tools that are maintained by inlang. With the [@inlang/core module](/documentation/build-on-inlang), you are able to build tools according your needs. Read more about the [infrastructure design principle](/documentation/why-inlang).

### IDE-Extension ([get notified](https://tally.so/r/wgbOpJ))

Improve developers' productivity by (semi)automating repetitive tasks like the extraction of messages, seeing localization related errors directly in the IDE and more.

![Screen Recording 2022-02-15 at 15 02 26](https://user-images.githubusercontent.com/35429197/154270998-3e8d147a-b979-4df5-b6df-a53c900d962e.gif)

### CLI ([get notified](https://tally.so/r/wgbOpJ))

Validate and extract messages in a repository with inlang's CLI.

![CLI validate example](https://cdn.jsdelivr.net/gh/inlang/inlang/assets/cli-validate.png)
