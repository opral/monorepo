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

Inlang is an open source localization solution for software build on top [Mozilla's Fluent project](https://projectfluent.org/).

## Goal

Build an ecosystem around Fluent and standardize localization of software.

## Status

[x] Alpha: Sufficient to manage translations for apps. Exploration phase to determine additional features.  
[ ] Beta: Sufficient for medium sized software projects with multiple components.  
[ ] Release: Production ready.

## Features

[x] Collaboration on translations with non-technical team members or translators.  
[x] Machine translations.  
[x] Linting of translations (in the dashboard).  
[x] Synchronize translations (via the CLI or Copy & Paste).  
[] Over the air updates without releasing a new version of your app.  
[] Self-hostable, see [this discussion](https://github.com/inlang/inlang/discussions/65).

Are you missing a feature? Head over to discussion to [request a new feature](https://github.com/inlang/inlang/discussions).

## Run Locally & Contribute

Fork this project

All scripts are shown in the `package.json` file(s).

### Run the whole inlang project

1. Install the [supabase cli](https://github.com/supabase/cli)
2. `npm install`
3. `npm run dev`
4. (for the dashboard) open [localhost:3000](http://localhost:3000/)

### Only a dedicated package

1. `npm install`
2. `npm run dev -w @inlang/<package_name>`

## Community & Support

- [GitHub Discussions](https://github.com/inlang/inlang/discussions): feedback and questions.
- [GitHub Issues](https://github.com/inlang/inlang/issues): bugs you encounter using inlang.
- [Discord](https://discord.gg/CUkj4fgz5K): contact the maintainers and hang out with the community.
