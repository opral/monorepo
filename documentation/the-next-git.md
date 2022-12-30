---
title: The next git
href: /documentation/the-next-git
description: Git, or more generalized version control, seems to be an appropriate backend for content heavy apps.
---

# {% $frontmatter.title %}

**Git as a backend may be superior to database-driven backends for various domains/applications. Inlang is git-based localization infrastructure and simultaneously a case study for version control-based applications. By building inlang, we might build a version control SDK.**

Git provides unprecedented (async) collaboration, automation, and review workflows. Git as a backend for localization infrastructure seems to make so much sense that we are building git-based localization infrastructure. However, there are drawbacks to using git as a backend, including the fact that it is a command line interface (CLI) rather than a software development kit (SDK). The complexity of git will (likely?) overwhelm non-technical (and technical!) users. If git as a backend, collaboration, and automation hub makes sense though, inlang will make localization easier and might lead the path for version control-based applications.

We have a module called [git-sdk](https://github.com/inlang/inlang/tree/main/source-code/git-sdk) that we plan to incrementally develop based on the engineering and user experience requirements of inlang.  

**Further read**

- [What if a Git SDK to build apps exists?](/blog/git-as-sdk)
- [March 2022: Does a git-based architecture make sense?](/blog/notes-on-git-based-architecture)
