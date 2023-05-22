---
# the frontmatter is only relevant for rendering this site on the website
title: inlang git server tech stack
description: The tech stack for the inlang git server
---

# inlang git server tech stack

## Overview

We will be building a (variant) of git-server soon as part of [the next git vision 2023](https://gist.github.com/araknast/d80f8b64b2777e42b49fd9e89e5a1b13).

## Requirements

- TypeScript to increase iteration speed (no Go, Rust, etc.) [High Confidence]

Similar to our findings in [git-sdk-requirements](../git-sdk-requirements/RFC.md), we want to iterate quickly and TypeScript is the best way to do so.

- No lock-in to a specific JS runtime (Node, Deno, Bun, Cloudflare workers, etc.) [High Confidence]

Developers should have the possibility to choose their own JS runtime based on their requirements. This ensures that inlang-git caters to a wider range of developers and subsequently apps being build with it.

- No lock-in to a specific deployment strategy (self-hosted, cloud, serverless etc.)

Developers should have the possibility to choose their own deployment strategy based on their requirements. This ensures that inlang-git caters to a wider range of developers and subsequently apps being build with it.

## Proposal

To be discussed
