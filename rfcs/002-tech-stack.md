---
# the frontmatter is only relevant for rendering this site on the website
title: Tech stack
href: /documentation/rfc-tech-stack
description: This RFC describes the tech stack of inlang.
---

### 💡 Discuss the RFC [here](https://github.com/inlang/inlang/pull/128).

# RFC 002: Tech Stack and Architecture of the editor + website

## TL;DR

Simplicity and control over feature-rich but complex off the shelf solutions.

Importance of long-term maintainability, development velocity, and the possiblity to [dogfood](https://en.wikipedia.org/wiki/Eating_your_own_dog_food) is valued higher than faster short-term development velocity.

Architecture: Monolith  
Framework: [SolidJS](https://www.solidjs.com/)  
Metaframework: [Vite Plugin SSR](https://vite-plugin-ssr.com/)  
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

The requirements above resemble a fusion of VSCode and Figma. VSCode due to the tight git integration that localization of software requires, and Figma due to the browser-based architecture. Figma does not need to be downloaded, installed and opened. Open a link in the browser and get started. A similar "one click ready to use" experience is desired for the inlang editor. VSCode recently released their effort to bring VSCode into the browser, see https://vscode.dev/. VSCode.dev brings another feature that the inlang editor requires: Local repositories and remote repositories can be used. Local repositories would allow developers to easily use the inlang editor while remote repositories make life easy for translators.

- Real-time collaboration ❔

Git's async collaboration features are deemed to be sufficient. Product usage and feedback will reveal whether real-time collaboration is benefitial and desired.

- Embeddable ❌

Integrating the editor into an IDE or text editor like VSCode could streamline the experience for developers. On the other hand, the requirement of the editor to work with local files reduces the benefit of an IDE integration. Offline support could be achieved by leveraging PWA (Progressive Web Application) features. The majority of professional content related applications like Google Docs, VSCode or Figma (all?) are architected as dedicated applications, illustrated by figure _(b)_.

Reasons against embeddability are runtime dependent features like networking or sandboxing JavaScript. However, the inlang config already delegates those requirements out of the editor. A network request would be required for machine translations for example. But, the inlang config could contain a callback `onMachineTranslate`. The host would be responsible for making the network request.

|            | Development speed | Maintenance effort | Potential extension |
| ---------- | ----------------- | ------------------ | ------------------- |
| Monolith   | +                 | +                  | o                   |
| Separated  | o                 | o                  | o                   |
| Embeddable | -                 | o                  | +                   |

<figure>
    <img src="./assets/002-embedded-separated-legend.png" alt="Legend"/>
</figure>

<figure>
    <img src="./assets/002-monolith-architecture.png"/>
    <figcaption>
        (a) Monolith architecture. Non-editor related and editor related elements are co-developed in one application/source code.
    </figcaption>
</figure>

<figure>
    <img src="./assets/002-separated-architecture.png"/>
    <figcaption>
        (b) Separated architecture. A website or app links to a separate application: <i>inlang.com</i> -> <i>editor.inlang.com</i>. Similar to clicking on a document in Google Drive. The click forwards from <i>drive.google.com</i> to another app <i>docs.google.com</i>. 
    </figcaption>
</figure>

<figure>
    <img src="./assets/002-embedded-architecture.png"/>
    <figcaption>
        (c) Embedded architecture. Host applications like inlang.com or VSCode embed the editor. 
    </figcaption>
</figure>

- SPA, SSR, MPA, (PWA)

The editor is a classical SPA while the website is SSR. Note however that the experience of using the editor should not be hidden behind a login screen. After all, inlang is great to crowd source translations.

- SEO ✅ (website) ❔ (editor)

SEO is important for the website and might be important for the editor.

## Choices

A monolith architecture has been chosen. The website and editor are co-developed in one codebase to increase development speed and reduce maintenance effort. For example, the monolith architecture enables the usage of sessions that store GitHub access tokens. Inlang does not require a dedicated auth system as no user data is stored. The need for a dedicated auth systems (and database) will surely arise. For now, it seems easier to leverage one server with sessions for authorization without the need to stitch microservices together.  

Framework: [SolidJS](https://www.solidjs.com/)
Metaframework: [Vite Plugin SSR](https://vite-plugin-ssr.com/)
UI components: [Tailwind](https://tailwindcss.com/) + [Shoelace](https://shoelace.style/) + [Zag.js](https://zagjs.com/)

### website (metaframework)

VPS (vite-plugin-ssr) has been chosen as metaframework. VPS is a low(er) level metaframework with high control and customization possibilities. Classical metaframework like Next.js or Remix are focused on SSR apps. Next.js can be used to build SPAs but that involves workarounds and ends up with fighting the framework. Vite-plugin-ssr enables us to define how specific routes should be rendered. For example, the editor under `inlang.com/editor` could be rendered as SPA while the rest of the website is server side rendered. A side benefit of vite-plugin-ssr is the possibility to leverage SSR for the editor too. Cloning repositories, for example, can take a minute for larger repositories. Loading initial data (like cloning a repo) is a classical example of an SSR usecase. Furthermore, vite-plugin-ssr allows us to decouple the editor from the website in the future. Routing, RPC calls and more stay identical.

#### why vite-plugin-ssr?

- Unify routing, auth, SEO of editor and website
- Control over different rendering modes (important because SSR of website and SPA of editor)
- Simple, no black box like a complete meta framework.
- Configure localization as we please

#### why not nextJS?

- Unify editor and website codebase + routing
- NextJs is not made for SPA apps

### editor (metaframework)

#### why vite-plugin-ssr?

- Unify routing, auth, SEO of editor and website
- Maybe SEO becomes important (architecture can be adjusted to support SSR)

#### Why not react router for the editor?

- Routing and auth will differ from website
- (No SSR, if SEO becomes important)

## design system (ui library)

### framework

A few things to consider:

1. The decision now is likely irreversible given the effort required to switch to another framework.
2. Inlang is a long-term project. I am confident that inlang is past an exploration phase of what needs to be build.
3. The architecture, performance and state management requirements of the editor involve uncertainty.

The translation management editor is running on top of a virtual file system that queries an inefficient (hacked) CLI. Thus, complex state management and (likely) performance is of high importance. SolidJS seems like the framework that learned from the best (Knockout, React, Angular, Vue) and bundles state management, good performance, SSR, and tooling (their community efforts) under one umbrella.

SolidJS has ultimately been choosen given the uncertainty of the editor's requirements in terms of performance and state management that will emerge. Furthermore, the tight coupling and best practices of SolidJS are anticipated to lead to faster development cycles, fewer bugs, and ultimately a better product. However, the choice waries risks: Whether the benefits of SolidJS outweigh the ecosystem that React has is to be determined.

In summary, SolidJS has been choosen because:

- Simple + built-in state management.
  - faster product development
  - better maintainability
- Uses the platform (web components, native JS packages work)
- Uses JSX, thereby synergy effects to React (worst case, switch to React is possible)
- Runtime approach (compiler just transforms JSX)
  - Reactivity works in plain JS, in contrast to Svelte, leading to less workarounds
- performance “for free”.
  - Performance is likely important for the editor.
- (Great documentation -> understandable for beginners)

Some videos about Solid's simple reactive system [[0]](https://www.youtube.com/watch?v=qB5jK-KeXOs) [[1]](https://www.youtube.com/watch?v=J70HXl1KhWE).

#### why not react?

- Anticipated slower development speed and higher maintainability effort.
  - De-coupled state management
  - Performance optimization needs to be conducted manually (likely important for the editor)

#### why not svelte?

- State management is inferior to SolidJS

  - For example, async fetching of data is "missing".
  - State can only be used in Svelte components, otherwise workarounds are required.

- No JSX

  - Requires custom ide extensions for .svelte files
  - not compatible with most JSX things.

- Typescript is a second-class citizen (partially because not compatible with JSX)

## design system

TailwindCSS + Shoelace + ZagJS. TailwindCSS provides fast styling, Shoelace off the shelf components with style, and ZagJS provides component logic for custom components. The goal is to incrementally develop our own design system over time instead of fighting pre-designed component libraries. Shoelace is eas(ier) to (re-)style than other component libraries, easing our path to a custom design system.

## markdown

### Why [Stripe's Markdoc](https://markdoc.dev/)?

Simplicity. Markdoc is "just" a markdown parser with customizable validation. The AST can be used to render the markdown and custom components.

- simple and customizable
- built-in validation for custom tags
- can be used to render interactive components like MDX (if required)
- portable because plain markdown + own renderer, not compiling to javascript like mdx

### Why not MDX?

- compiling to javascript complicates things
- dependent on javascript runtime (less portable)
