---
og:title: "Inlang v0.2"
og:description: "Inlang v0.2 is released."
---

# Inlang v0.2

## The Goal

With v0.2 the goal of inlang takes a concreter shape: **Make internationalization and localization of software X times faster through standardization, developer tools and automation.**
Starting by explaining the difference between those two terms.
Wikipedia describes the differences as following:

> Internationalization is the process of designing a software application
> so that it can be adapted to various languages and regions without engineering changes.
> Localization is the process of adapting internationalized software for a specific region
> or language by translating text and adding locale-specific components. [0]

**Internationalizing software should be plug and play, yet it's not.** Every programming language,
framework and library comes with its own solutions to something that should be straightforward:
Text in source code should be displayed in the corresponding language of the user.
It's less frustrating to set up Stripe than to set up internationalization.
Inlang is out there to change that status quo by building a series of developer
tools starting with the [VSCode extension](https://github.com/inlang/inlang/tree/main/apps/vs-code-extension).

**Localizing software (content) involves tons of manual tasks that are screaming to be automated**: Hand-offs via email,
collaboration via excel spreadsheets, no (automated) Q&A pipelines, no version control, the list goes on.
Inlang is going to address that problem space too.
Version 0.2 eliminates hand-offs and collaboration via excel spreadsheets.

> Inlang is early and by no means has found the best answers to address the
> problems mentioned above. Take [part in the
> discussions](https://github.com/inlang/inlang/discussions) and help make
> internationalization and localization easier than setting up Stripe.

## What changed?

### Agnostic

**Inlang now works independently of the chosen i18n library, framework and even programming language.**
The architecture has been re-designed to support every software environment as long as the file format
used for the translations is Fluent, or a [converter](/docs/glossary/converter) exists.

### Built on top of Mozilla's Fluent system

Standardizing the localization process starts with standardizing the file format. Mozilla recently released [Fluent](https://projectfluent.org),
a dedicated system solely to express human languages and solve problems with other i18n systems (file formats). While not perfect,
it seems to be the best format and system to build an ecosystem around. [Here](https://hacks.mozilla.org/2019/04/fluent-1-0-a-localization-system-for-natural-sounding-translations/)
is a deeper article about Fluent.

### Offline support

The architecture has ben re-designed to enable developer focused tools like the VS Code extension and CLI to work
completely independent of the dashboard and thus do not require an account or internet connection to inlang.

## Demonstration

### VS Code extension

Extract, show and lint patterns (translations) directly in the IDE. No more copy & pasting of patterns into
translation files.

![vscode inline annotations](./assets/vscode-extension-pattern-extraction.gif)

### CLI

Synchronize translation files in source code with remote translation files used by non-technical team members and translators.

> In the near future the CLI is supposed to provide additional tooling like
> linting the source code, extracting translations etc. If you have more ideas,
> open a discussion.
### Dashboard

Non-technical team members and translators can manage translations without touching source code. The dashboard
now includes linting and overall is more refined.

![dashboard](./assets/dashboard-example.webp)

### Getting started in 3 minutes

Watch the demo: https://youtu.be/cEjEAcAFfsA

---

**Want to stay up to date?**  
Sign up for the newsletter at https://opral.substack.com/t/inlang

## Footnotes

[0] https://en.wikipedia.org/wiki/Internationalization_and_localization#:~:text=Internationalization%20is%20the%20process%20of,and%20adding%20locale%2Dspecific%20components.
