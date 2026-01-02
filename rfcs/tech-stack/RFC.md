---
# the frontmatter is only relevant for rendering this site on the website
title: Tech stack
href: /blog/rfc-tech-stack
description: This RFC describes the tech stack of inlang.
---

### 💡 Discuss the RFC [here](https://github.com/opral/inlang/pull/128).

# RFC 002: Tech Stack and Architecture of the editor + website

## TL;DR

Simplicity and control over off the shelf solutions in light of ambigious requirements of localization infrastructure.

Architecture: Monolith, designed to be split in the future.
Framework: [SolidJS](https://www.solidjs.com/)  
Metaframework: [Vite Plugin SSR](https://vike.dev/)  
Design system: [Tailwind](https://tailwindcss.com/) + [Shoelace](https://shoelace.style/) + [Zag.js](https://zagjs.com/)  
Markdown: [Markdoc](https://markdoc.dev/)

## Scope of this RFC

### Goals

- Define architectural requirements.
- Choose a front-end framework.

### None-goals

- Define small features of the editor that can be implement regardless of the architecture.

## Requirements

> **Legend**
>
> ✅ = yes  
> ❔ = maybe in the future  
> ❌ = no

- Git integration ✅
- One-click "ready to use" ✅
- Compatible with local and remote files ❔

The requirements above resemble a fusion of Visual Studio Code and Figma. Visual Studio Code due to the tight git integration that localization of software requires, and Figma due to the browser-based architecture. Figma does not need to be downloaded, installed and opened. Open a link in the browser and get started. A similar "one click ready to use" experience is desired for the inlang editor. Visual Studio Code recently released their effort to bring Visual Studio Code into the browser, see https://vscode.dev/. Visual Studio Code.dev brings another feature that the inlang editor requires: Local repositories and remote repositories can be used. Local repositories would allow developers to easily use the inlang editor, while remote repositories would make life easy for translators.

- Real-time collaboration ❔

Git's async collaboration features are expected to be sufficient for the start. Product usage and feedback will reveal whether real-time collaboration is required.

- Embeddable ❔

Making the editor embeddable, like Microsoft's Monaco that powers Visual Studio Code could lead to interesting usecases.

For example, integrating the editor into an IDE or text editor like Visual Studio Code could streamline the experience for developers by removing the requirement for app/context switching. Furthermore, the editor could work with local repositories, removing the requirement for a backend entirely. Leveraging PWA (Progressive Web Application) features can achieve full offline support.

Reasons against embeddability include runtime-dependent features like networking, web worker support, and more. For the sake of increasing development speed, embeddability is not focused on, but accounted for by the architecture. The metaframework vike allows the unbundling of the editor from a monolith architecture.

|            | Development speed | Maintenance effort | Potential extension |
| ---------- | ----------------- | ------------------ | ------------------- |
| Monolith   | +                 | +                  | o                   |
| Separated  | o                 | o                  | o                   |
| Embeddable | -                 | o                  | +                   |

{% Figure
src="https://cdn.jsdelivr.net/gh/opral/inlang/rfcs/tech-stack/assets/002-embedded-separated-legend.png"

    alt="Legend"

/%}

{% Figure
src="https://cdn.jsdelivr.net/gh/opral/inlang/rfcs/tech-stack/assets/002-monolith-architecture.png"

    alt="Monolith architecture"

    caption="(a) Monolith architecture. Non-editor related and editor related elements are co-developed in one application/source code."

/%}

{% Figure
src="https://cdn.jsdelivr.net/gh/opral/inlang/rfcs/tech-stack/assets/002-separated-architecture.png"

    alt="Separated architecture"

    caption="(b) Separated architecture. A website or app links to a separate application: inlang.com -> editor.inlang.com. Similar to clicking on a document in Google Drive. The click forwards from drive.google.com to another app docs.google.com."

/%}

{% Figure
src="https://cdn.jsdelivr.net/gh/opral/inlang/rfcs/tech-stack/assets/002-embedded-architecture.png"

    alt="Embedded architecture"

    caption="(c) Embedded architecture. Host applications like inlang.com or VS Code embed the editor."

/%}

- SPA, SSR, MPA, (PWA)

The editor is a classical SPA while the website is SSR. Note however that the experience of using the editor should not be hidden behind a login screen. After all, inlang is great to crowd source translations.

- SEO ✅ (website) ❔ (editor)

SEO is important for the website and might be important for the editor.

## Choices

A monolithic architecture has been chosen.

The website and editor are co-developed in one codebase to increase development speed and reduce maintenance effort. For example, inlang does not require a dedicated auth system as no user data is stored. The need for a dedicated auth systems (and databases) will surely arise. For now, it seems easier to leverage one server with sessions for authorization without the need to stitch microservices together. As the requirements evolve, the monolith can be split into a website, editor and server without much overhead given that vike has been choosen as metaframework.

Framework: [SolidJS](https://www.solidjs.com/)
Metaframework: [Vite Plugin SSR](https://vike.dev/)
UI components: [Tailwind](https://tailwindcss.com/) + [Shoelace](https://shoelace.style/) + [Zag.js](https://zagjs.com/)

### Metaframework

VPS (vike) has been chosen as metaframework to enable a monolith architecture that can be unbundled in the future.

VPS is a low(er) level metaframework with high control and customization possibilities. Classical metaframework like Next.js or Remix are focused on SSR apps. Next.js can be used to build SPAs but that involves workarounds and ends up with fighting the framework. Vite-plugin-ssr partially enables the monolith architecture by specifying a server that renders vike sites and supporting SPA and SSR render modes. For example, the editor under `inlang.com/editor` could be rendered as SPA while the rest of the website is server-side rendered. A side benefit of vike is the possibility to leverage SSR for the editor too. Cloning repositories, for example, can take a minute for larger repositories. Loading initial data (like cloning a repo) is a classical example of an SSR use case. Furthermore, vike allows us to decouple the editor from the website in the future. Routing, RPC calls and more stay identical.

#### Why vike?

- Control over different rendering modes (important because SSR of website and SPA of editor)
- Maybe SEO becomes important for the editor too (architecture can be adjusted to support SSR)
- If the monolith is broken up into a server, website and editor, vike "simply" needs to be unbundled. The routing, templating and server logic stay identical.
- High control/no magic blackbox. For example, localization can be configured as we please and require.

#### Why not something like Next.js?

- Unify editor and website codebase + routing
- NextJS is not made for SPA apps

#### Why not react/tanstack/solid router for the editor?

- Routing and auth will differ from website, making unbundling of the monolith stack difficult/require us to use microservices from the get go.
- (No SSR, if SEO becomes important for the editor)

## Design System (UI library)

### Framework

A few things to consider:

1. The decision now is likely irreversible given the effort required to switch to another framework.
2. Inlang is a long-term project. I am confident that inlang is past an exploration phase of what needs to be build.
3. The architecture, performance and state management requirements of the editor involve uncertainty.

The translation management editor is running on top of a virtual file system that queries an inefficient (hacked) CLI. Thus, complex state management and (likely) performance is of high importance. SolidJS seems like the framework that learned from the best (Knockout, React, Angular, Vue) and bundles state management, good performance, SSR, and tooling (their community efforts) under one umbrella.

SolidJS has ultimately been chosen given the uncertainty of the editor's requirements regarding performance and state management that will emerge. Furthermore, the tight coupling and best practices of SolidJS are anticipated to lead to faster development cycles, fewer bugs, and ultimately a better product. However, the choice varies risks: Whether the benefits of SolidJS outweigh the ecosystem that React has is to be determined.

**In summary, SolidJS has been chosen because:**

- Performance is likely going to be crucial for the editor.
- Uses JSX, thereby synergy effects to React (worst case, switch to React easier than fro Svelte)
- Runtime approach (compiler just transforms JSX)
  - Reactivity works in plain JS, in contrast to Svelte, leading to less workarounds
  - The reactive system is de-coupled from rendering. Thus, the reactive system can be used in other applications like the ide-extension.

#### Why not React?

- Performance is likely going to be crucial for the editor.

#### Why not Svelte?

- State management is inferior to SolidJS

  - For example, async fetching of data is "missing".
  - State can only be used in Svelte components; otherwise workarounds are required.

- No JSX

  - Requires custom ide extensions for .svelte files
  - not compatible with most JSX things.

- Typescript is a second-class citizen (partially because not compatible with JSX)

## Design system

TailwindCSS + Shoelace + ZagJS. TailwindCSS provides fast styling, Shoelace off-the shelf components with style, and ZagJS provides component logic for custom components. The goal is to incrementally develop our own design system over time instead of fighting pre-designed component libraries. Shoelace is eas(ier) to (re-)style than other component libraries, easing our path to a custom design system.

## Markdown

### Why [Stripe's Markdoc](https://markdoc.dev/)?

Simplicity. Markdoc is "just" a markdown parser with customizable validation. The AST can be used to render the markdown and custom components.

- simple and customizable
- built-in validation for custom tags
- can be used to render interactive components like MDX (if required)
- portable because plain markdown + own renderer, not compiling to javascript like mdx

### Why not MDX?

- compiling to javascript complicates things
- dependent on javascript runtime (less portable)
