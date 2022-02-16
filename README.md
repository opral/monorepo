<div>
    <p align="center">
        <img width="300" src="https://raw.githubusercontent.com/inlang/inlang/main/assets/logo-white-background.svg"/>
    </p>
    <h2 align="center">
        Open Source Localization Solution for Software
    </h2>
    <h3 align="center">
        <a href="https://inlang.dev/docs/getting-started" target="_blank">Get Started</a> · <a href="https://inlang.dev/docs/intro" target="_blank">Documentation</a> · <a href="https://inlang.dev/blog" target="_blank">Blog</a>
    </h3>
</div>

# Inlang

> Difference between internationalization and localization? -> [Wikipedia definition](https://en.wikipedia.org/wiki/Internationalization_and_localization#:~:text=Internationalization%20is%20the%20process%20of,and%20adding%20locale%2Dspecific%20components.)

Inlang is an ecosystem of developer tools (speeding up internationalization of software) and localization platform. 
 

## Goal 

Internationalization and localization of software should be 2x, 3x, 4x faster. 
  

## Apps

> :bulb: The apps and features you see below are the features that are available right now. More is planned.


### [cli](apps/cli)  
Synchronize translation files in source code with remote translation files used by non-technical team members and translators. 

Besides synchronization between the dashboard and source code, the CLI is supposed to provide additional tooling like linting the source code, extracting translations etc. If you have more ideas, open a discussion. 

### [dashboard](apps/dashboard)  
Let non-technical team members and translators manage translations for you.

![dashboard-example](https://user-images.githubusercontent.com/35429197/154271089-9acf02c3-7c6e-435c-9014-6ee21426ab4d.png)


### [vs-code-extension](apps/vs-code-extension)  
Extract and show patterns directly in your IDE. 

> :bulb: The VS Code extension works independently of the dashboard and CLI.


![Screen Recording 2022-02-15 at 15 02 26](https://user-images.githubusercontent.com/35429197/154270998-3e8d147a-b979-4df5-b6df-a53c900d962e.gif)


## Packages

Inlang is split into smaller packages that can be leveraged by developers.

### [fluent-syntax](packages/fluent-syntax)  
Fluent (syntax) AST.  

This package is a wrapper around the official [@fluent/syntax](https://projectfluent.org/fluent.js/syntax/) package with additional classes, types and helper functions to increase ease of use of Fluent resources (as file, or AST).

### [fluent-syntax-converters](packages/fluent-syntax-converters)  
Parse and serialize i18n file formats/syntaxes other than [Fluent](https://projectfluent.org/) to and from Fluent.

### [fluent-lint](packages/fluent-lint)  
Lint Fluent AST types such as `Pattern` etc. 

### [config](packages/config)  
The inlang config schema and parser.

### [common](packages/common)  
Common types, helper function, etc. used throughout the inlang project.

## Community & Support

- [GitHub Discussions](https://github.com/inlang/inlang/discussions): feedback and questions.
- [GitHub Issues](https://github.com/inlang/inlang/issues): bugs you encounter using inlang.
- [Discord](https://discord.gg/CUkj4fgz5K): contact the maintainers and hang out with the community.

## Run Locally & Contribute

### 1. Fork this project

![fork](https://raw.githubusercontent.com/inlang/inlang/main/assets/fork-project.webp)

### 2. Run the whole inlang project

1. Install the [supabase cli](https://github.com/supabase/cli)
2. `npm install`
3. `npm run dev`
4. (for the dashboard) open [localhost:3000](http://localhost:3000/)

### (3. Or only a dedicated package)

1. `npm install`
2. `npm run dev -w @inlang/<package_name>`

