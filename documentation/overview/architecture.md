---
title: Architecture
href: /documentation/architecture
description: TODO TODO TODO TODO TODO 
---

# {% $frontmatter.title %}

Inlang's architecture consists of four main components:

1. [Applications](/documentation/app) - Provide users with an interface for their projects.
2. [SDK](/documentation/sdk) - Can be used by developers to build inlang apps.
3. [Project file](/documentation/project-file) - Defines the project's settings, which language tags exists and to be imported packages.
4. [Packages](/documentation/package) - Contain plugins and/or lint rules that define the behavior of a project.

```mermaid
flowchart BT
    subgraph App[Applications]
        UI[User Interface]
    end 
    subgraph SDK
        API
        Query
        Linting
    end
    subgraph Project[Project File]
        LanguageTags[Language Tags]
        Settings
        UsedPackages[Packages]
    end
    subgraph Packages
        Lint[Lint Rules]
        Plugins
    end
    SDK --> App
    Project --> SDK
    Packages --> Project
```