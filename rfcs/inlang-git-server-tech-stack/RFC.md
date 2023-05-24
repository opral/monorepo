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

All requirements seem to be fulfilled by having a "modern express" server that is runtime and deployment-independent. Deploying plain JS is extremly simple.

### Comparing existing solutions

There are two solutions out there that I am aware of.

#### [Hattip](https://github.com/hattipjs/hattip)

> Instead of writing server code that only works with Express.js, write server code that can be deployed anywhere: AWS, Cloudflare Workers, Vercel, VPS, ...

##### Pros

- Strictly obeying to [WinterCG](https://wintercg.org/), ensuring web-interopability
- The project is small and needs a main adopter. We could be the main adopter, sponsor the project, and influence the direction of the project. (With more financial resources, we could maybe even hire the authors to work on hattip and VPS (the framework for the editor) full-time to derisk our tech stack decision and help hattip grow).
- @samuelstroschein is in closer contact with one of the maintainers (@brillout) who is brilliant in responding to issues.

##### Cons

- Early. The project is still in early stages and has not been used in production yet. This is a risk we would have to take.
- Hono is establishing itself as the goto "express" of the future, potentially making hattip a slightly better express, but not the goto framework for the future. Similar to express vs fastapi etc.

#### [Hono](https://github.com/honojs/hono)

> Hono - [炎] means flame🔥 in Japanese - is a small, simple, and ultrafast web framework for the Edges. It works on any JavaScript runtime: Cloudflare Workers, Fastly Compute@Edge, Deno, Bun, Vercel, Lagon, AWS Lambda, and Node.js.

##### Pros

- Wider adoption than hattip.
- Seems more mature than hattip.

##### Neutral

- Hattip seems to have a stricter goal of becoming the default middleware/server system for the web, see https://github.com/honojs/hono/issues/443.

##### Cons

- Doesn't seem to obey to [WinterCG](https://wintercg.org/) to ensuring web-interopability.
- Already bloated with "nice to have" features that are implemented extremely opinioated like RPC that use tRPC and Zod under the hood, see https://hono.dev/guides/rpc. This is a risk for us as we might have to fight against the framework to implement our own features.
