---
title: The next git
href: /documentation/the-next-git
description: Git, or more generalized version control, seems to be an appropriate backend for content heavy apps.
---

# {% $frontmatter.title %}

**Inlang might bring version control to domains outside of software engineering.**

{% Figure

    src="https://cdn.jsdelivr.net/gh/inlang/inlang/documentation/assets/what-if-1000-artists.jpeg"
    alt="What if 1000s of artists are able to create a song together?"
    caption="A slide from one of the first presentations about inlang being built on git, and the possibilities version control might open. The image has been taken from the iconic iPod campaign."

/%}

Inlang is git-based localization infrastructure and, simultaneously, a case study for version control-based applications. Git provides unprecedented (async) collaboration, automation, and simple review flows out of the box. Wouldn't version control be benefitial to domains outside of software engineering? What if artists could collaborate on a song in the way software engineers collaborate on open source software? What if open source mechanical engineering would be as common as open source software? What if... version control enables new workflows and apps with built-in version control are better than their counterparts?

Abusing a command line interface (CLI) to run in the browser with a virtual file system is cumbersome. The complexity of git will (likely?) overwhelm (non-technical) users. Yet, that is exactly what we are doing with inlang: The advantages seem to outweigh the costs. _Seem_ because we have to prove it. If inlang makes localization substantially easier, we might lead the path for version control based applications.

We have a module called [git-sdk](https://github.com/inlang/inlang/tree/main/source-code/git-sdk) that we plan to incrementally develop based on the engineering and user experience requirements of inlang.

**Further read**

- [What if a Git SDK to build apps exists?](/blog/git-as-sdk)
- [March 2022: Does a git-based architecture make sense?](/blog/notes-on-git-based-architecture)
