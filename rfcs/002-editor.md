# RFC 002: Editor (CAT)

Translators, and developers to a certain extend, require an editor to create and manage translations. Such an editor is sometimes referred to as CAT (computer-assisted translation) editor.

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
- Compatible with local and remote files ✅

The requirements above resemble a fusion of VSCode and Figma. VSCode due to the tight git integration that localization of software requires, and Figma due to the browser-based architecture. Figma does not need to be downloaded, installed and opened. Open a link in the browser and get started. A similar "one click ready to use" experience is desired for the inlang editor. VSCode recently released their effort to bring VSCode into the browser, see https://vscode.dev/. VSCode.dev brings another feature that the inlang editor requires: Local repositories and remote repositories can be used. Local repositories would allow developers to easily use the inlang editor while remote repositories make life easy for translators.

- Real-time collaboration ❔

Git's async collaboration features are deemed to be sufficient. Product usage and feedback will reveal whether real-time collaboration is benefitial and desired.

- TODO: Embeddable

Integrating the editor into an IDE or text editor like VSCode could streamline the experience for developers. On the other hand, the requirement of the editor to work with local files reduces the benefit of an IDE integration. Offline support could be achieved by leveraging PWA (Progressive Web Application) features. The majority of professional content related applications like Google Docs, VSCode or Figma (all?) are architected as dedicated applications, illustrated by figure _(b)_.

Reasons against embeddability are runtime dependent features like networking or sandboxing JavaScript. However, the inlang config already delegates those requirements out of the editor. A network request would be required for machine translations for example. But, the inlang config could contain a callback `onMachineTranslate`. The host would be responsible for making the network request.

<!-- Considering that the editor requires sandboxing JavaScript, networking and more runtime dependent features, the overhead of encapsulating those features to make the editor embeddable seems unreasonbale. For the same reasons, choosing a monolith architecture that would mix a sophisticated web application with a semi-static website seems unfavourable. Hence, a seperated architecture is chosen. -->

|            | Development speed | Maintenance effort | Potential extension |
| ---------- | ----------------- | ------------------ | ------------------- |
| Monolith   | +                 | -                  | -                   |
| Separated  | o                 | +                  | o                   |
| Embeddable | o                 | o                  | +                   |

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

- TODO: SPA, SSR, MPA, (PWA)

## Architecture

## Appendix

### Gitpod architectur

Gitpod spins up a cloud based IDE. [This video](https://youtu.be/svV-uE0Cdjk?t=544) explains the architecture behind gitpod. One word: complex. The complexity seems to stem from the fact that high computation resources are required to execute code. Think of compiling a program. The inlang editor does not seem to require such computation power, and hence not such a complex architecture.
