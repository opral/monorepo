# Introduction

Welcome to the inlang documentation!

---

## What is inlang?

inlang offers tailored localization products for each [use case](/#personas) (Developer, Designer, Translator). You only have to set inlang up once; then, you can use every inlang app out of the box. 

All the data is derived from a single source of truth, stored in your repository, and managed under [change control](/#lix) to enable collaboration and automation. This allows you to focus on building your application instead of spending time with localization.

Whether you're an individual developer or part of a larger team, inlang can help you enjoy building global applications.

---

## First class features

Some of the main inlang features include:

- **Decentralized workflows** - Don't force devs in a cloud solution; let devs, translator and designer work in their native environment. ([Apps](/c/apps))
- **One source of truth** - Never have syncing problems again; The data is always stored in your repo while collaborator can work on it in their own interface.
- **Quality management** - Define [Lint Rules](/documentation/lint-rule) for your project to ship quality cross-app. 
- **Automations** - With lix change control you can use CI/CD to check lint, machine translate, validate and more. (Continuous Localization)
- **Review** - PR workflows can be used to gain control over the merged content.
- **Integration** - With [plugins](/c/plugins) every project can get inlang ecosystem compatible.

---

## What makes inlang an ecosystem?

![Project directory](https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/documentation/ecosystem/assets/ecosystem_new.png)

Have you ever wondered why the set of inlang [apps](/documentation/concept/app) and [plugins](/documentation/plugin) is called an ecosystem? Here are a few reasons: 

- All the apps use lix change control, which makes it easier for multiple users to collaborate. 
- The apps work with the data that is stored in the repository. 
- Once you have set up your inlang project, you can use all the apps without any additional effort.
- Our community can build apps, plugins and lint rules to customize their experience.

Read more about this here: [inlang ecosystem](/g/7777asdy/)

---

## Let's get concrete

In order to make your repository compatible with the inlang applications, you will need to create an inlang [project](/documentation/concept/project). This project essentially consists of a folder (`[project_name].inlang`) that includes a `settings.json` file and a `project_id` file. The `settings.json` file determines how your localization data is stored, as well as how you want to lint your data. The `project_id` is automatically generated.

![Project directory](https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/documentation/ecosystem/assets/project_new2.png)

You can have multiple inlang projects in your repository. This is useful in a monorepo setup. If you need a guide to get started, visit the individual pages of the inlang [apps](/c/apps).

<br/>
<br/>
<br/>