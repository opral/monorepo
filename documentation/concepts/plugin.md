---
title: Plugin
href: /documentation/concepts/plugin
description: An inlang plugin defines and extend how an inlang app should behave.
---

# {% $frontmatter.title %}

{% $frontmatter.description %}

For example, plugin A defines that [messages](/documentation/concepts/message) should be stored in a database, while plugin B defines that messages should be stored in a file. An [inlang app](/documentation/concepts/inlang-app) that uses plugin A will store messages in a database, while an inlang app that uses plugin B will store messages in a file.

Learn how to build your own plugin in the [develop an inlang plugin guide](/documentation/guides/develop-plugin).

<!-- TODO #1301 visualization of app that behaves differently if plugin A or plugin B is used -->

