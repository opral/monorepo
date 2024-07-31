---
# https://vitepress.dev/reference/default-theme-home-page
layout: home
title: SQLocal
titleTemplate: false

hero:
  name: 'SQLocal'
  text: 'Local-First Database'
  tagline: Run SQLite3 in the browser, backed by the origin private file system.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/introduction
    - theme: alt
      text: View on GitHub
      link: https://github.com/DallasHoff/sqlocal

features:
  - title: Any Query
    icon: 🔎
    details: Locally executes any query that SQLite3 supports
  - title: Threaded
    icon: 🧵
    details: Runs the SQLite engine in a web worker so queries do not block the main thread
  - title: Persisted
    icon: 📂
    details: Persists data to the origin private file system, which is optimized for fast file I/O
  - title: Per-User
    icon: 🔒
    details: Each user can have their own private database instance
  - title: Simple API
    icon: 🚀
    details: Just name your database and start running SQL queries
  - title: TypeScript
    icon: 🛠️
    details: Works with Kysely and Drizzle ORM for making type-safe queries
---
