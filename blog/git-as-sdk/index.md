---
og:title: What if a Git SDK to build apps exists?
og:description: Git as a backend and content database might be superior to database driven solutions for apps like Figma, Google Docs, & Co.
---

# What if a Git SDK to build apps exists?

While exploring how to design a developer-first localization solution (also known as i18n, aka offering software in different human languages), I realized that git as a backend might be superior to database driven solutions for applications like Figma, Google Docs, & Co. I refer to a cloud-based backend as a backend where users operate on documents that are stored in a database, opposed to documents in the form of files.

## Background

I have been exploring how to make localization of software simpler for over a year now. The journey started with the annoyance of localizing an app. Among the annoyances were constantly missing or outdated translations and the hand-off steps between developers and translators. The solution seemed simple: Build a developer-first localization solution consisting of dev tools and an editor for translators to manage translations. The dev tools would be like typesafety for localization, catching errors such as overflowing or missing translations before pushing to production while the editor gives translators a UI to manage translations.

## Synchronizing a database with git is a great engineering effort

However, I ran into a major obstacle a few months into building the localization solution. The cloud-based translation management editor required two-way synchronization between translation files in git repositories and the relational database that powers the editor. In contrast to other cloud-based solutions which, once adopted, become the source of truth, git stays the localization source of truth for developers. Translators conduct changes on documents in the database (the cloud) while developers would still conduct their changes in files that are stored in git repositories. This leads to “two sources of truth” which require two-way sync. Two-way sync turned out to be difficult to implement. Software engineers make use of version control enabled workflows like branches. If the dev tools and editor are supposed to work hand-in-hand, the editor and thereby the database schema must support branches too. I couldn’t wrap my head around the design (hacking) of a database schema that enables two-way sync with data in git repositories with reasonable engineering effort. Supporting branches alone added a level of complexity that required complicated merge resolutions and heuristics. In March of this year though, I had a lightbulb moment though: “Why am I trying to replicate git on a database instead of using git itself?”

## Git is awesome as a back-end…

Git provides everything to build content-based web apps (like an editor for translators): Storage, version control, automation via CI/CD, and a simple but ingenious review system via pull requests essentially “for free”. Additionally, developers and translators would be able to collaborate within the same source of truth with deep implications. The traditional way of “sequential collaboration”, where a translator only gets to work once developers finish their work, could be turned into “parallel collaboration”. Developers and translators could, for example, collaborate on the same pull request in parallel. The development speed of parallel collaboration should, by definition, be faster than sequential hand-offs.

## …but git as back-end is not perfect

I built a prototype of a git-based translation editor a few months back. Super hacky, basically abusing a CLI as an SDK, that is running in the browser on top of a virtual file system. It worked surprisingly well though. So good even, that we scrapped the previous iteration of the product and started from scratch two months ago.

There are drawbacks to a git-based back-end though:

1. Git is a CLI, not an SDK. Building a professional application on top of git leads to numerous workarounds and <s>really ugly</s> difficult to maintain code.
2. Git is too complicated, even for software engineers. Bringing the power of git to non-technical people (translators) is a difficult design challenge.
3. Git offers great async collaboration, but no real-time collaboration.

## What if a Git SDK exists?

I am wondering what happens if we, or someone else, were to overcome the challenges of building an app on git today. The solution could be an SDK and mental model that works for non-technical people. In theory, apps that build on such an SDK would be simpler to build. They would just be a front-end over data that exists in the form of files. There is less cloud infrastructure to manage and adoption becomes easier. You don’t like Adobe Acrobat to read PDFs? Just use Apple Preview then. In contrast to “file-based” applications that we’ve used over the last decades, “git-based” applications would be collaborative out-of-the-box and have inherent tremendous automation capabilities (CI/CD).

For example, what if a design tool like Figma would be built on such a Git SDK?

Wouldn’t the development speed increase because designers and developers are able to collaborate in parallel instead of relying on sequential hand-offs? Wouldn’t innovation be fostered because such a version of Figma would have less lock-in and users could open the design file in another, more innovative front end, like (joke intended) Sketch? And wouldn’t open-source design become more viable because external contributors can simply open a pull request instead of requesting access to a document?

A related and suggested read is [local first software](https://www.inkandswitch.com/local-first/) from Ink & Switch. They point out several flaws of git as a backend compared to CRDTs
