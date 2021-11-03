<a href="https://youtu.be/mQkD1Wckp3U" target="_blank">
    <p align="center">
        <img width="400rem" src="https://raw.githubusercontent.com/inlang/inlang/main/assets/inlang-example.gif" />
        <img width="400rem" src="https://raw.githubusercontent.com/inlang/inlang/main/assets/inlang-in-81-seconds-banner.jpeg">
    </p>
</a>

# inlang

Inlang is an open source localization (translation) solution for mobile and web apps with developer experience (DX) in mind. Don't create translations manually in JSON files or (ab)use excel spreadsheets to manage translations. With inlang you get collaboration with automatic sync, type safety and machine translations in one tight package.

But that's just the beginning. We want to help you localize your apps with one click. Want to stay up-to-date? [Subscribe to our newsletter](https://cdn.forms-content.sg-form.com/e22e6493-370b-11ec-9784-62d300bd6ea3) (no spam!)

**Status**

- [x] Early Alpha: We are testing the solution and need your feedback.
- [ ] Beta: Stable enough for small(er) apps and projects.
- [ ] Release: Production ready.

**Supported Languages**

- [x] TypeScript using [typesafe-i18n](https://github.com/ivanhofer/typesafe-i18n)
- [ ] Dart / Flutter
- [ ] Swift / iOS
- [ ] Kotlin / Android

**Features**

- [x] Typesafety (no more missing translations/keys)
- [x] Collaboration via the dashboard
- [x] Sync between dashboard and source code
- [x] Variables / Interpolation
- [ ] OTA (Over the air updates without releasing a new version)
- [ ] Pluralization 

Are you missing a feature? Head over to discussion to [request a new feature](https://github.com/inlang/inlang/discussions).

## Getting started

Link to documentation
https://docs.inlang.dev

## Community & Support

- [GitHub Discussions](https://github.com/inlang/inlang/discussions): public feedback and questions.
- [GitHub Issues](https://github.com/inlang/inlang/issues): bugs you encounter using inlang.
- [Discord](https://discord.gg/CUkj4fgz5K): contact the maintainers and hanging out with the community.

## Demo

### Step 1 - Create keys directly in VSCode

Keys are automatically sent to the dashboard, machine translated into all languages and synced with your source code. Bonus on top: typesafety (no more missing translations/none existent keys).
![Create keys directly in VSCode which are automatically sent to the dashboard and injected into the code](./assets/step1.gif)

### Step 2 - Manage translations in the dashboard

Collaborators, or you yourself, can seamlessly edit translations in the dashboard. During development the translations are automatically synced with the source code.
![Editing and syncing translations from the dashboard to source code](./assets/step2.gif)
