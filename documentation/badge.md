---
title: Badge Generator
shortTitle: Badges
href: /documentation/badge
description: Generate a badge to show your project's translation progress.
---

# {% $frontmatter.shortTitle %}

This example shows how the badge looks like in a GitHub README based on the example project:

[![translation badge](https://inlang.com/badge?url=github.com/inlang/example)](https://inlang.com/editor/github.com/inlang/example?ref=badge)

## Quick Generator

Enter your repository to copy the badge markdown to your clipboard.
{% BadgeGenerator /%}

## Guide

This documentation page provides information about the Badge endpoint, which allows users to generate badges dynamically. The badge generation API endpoint can be used in Github READMEs and anywhere else on the web to display real-time data on your projects.

This badge provides you with the overall translation progress of your project. It is a great way to show off your project's localization progress to your users.

Furthermore, you get the numbers of errors and warnings to keep track of your project's quality and engage contributors to fix them right from the inlang [editor](/editor).

### Snippet

```md
### Translation status

[![translation badge](https://inlang.com/badge?url=github.com/username/repo)](https://inlang.com/editor/github.com/username/repo?ref=badge)
```

Please note to replace `username/repo` with your username or organization name and your repositories name and make sure to add a `ref=badge` query parameter to the link, so we can prevent bad actors from spamming our services.

## API Endpoint

The badge generation endpoint can be accessed using a GET request to the `/badge` route.

The following query parameters are supported:

- `url` - the URL of the repository to generate the badge for. For example, `?url=github.com/inlang/example`.

The `url` parameter is required, and the response will be a PNG image containing the generated badge.

### Example Request

```sh
GET /badge?url=github.com/username/repo
```

### How it works

The Bagde API generates a status badge for your project's localization progress. When you call this link with your project's GitHub README, it clones your repository, reads the inlang.config.js file, and retrieves all the translations for the specified language.

Then, it calculates the translation progress percentage, marks up the result with beautiful styling, and renders the final badge image.
