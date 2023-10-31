# How to setup inlang for your project

## Mandatory

You need two things to use inlang with any project:
1. A `project.inlang.json` file in the root of your project
2. A plugin that reads and writes the messages from and to your project

There are two ways to get these:
1. Create them manually
2. Create them automatically with init command by inlang (soon)

### Project file

An inlang project is defined by a file that is named `project.inlang.json`. The file contains the settings for a project and is the entrypoint for all applications, plugins, and tools in the inlang ecosystem.

### Read/write plugin

You need the right plugin to read and write messages from and to your project depending on:
- the **file format** of your translation files
- the **message format** of your messages

## Recommended: Use inlang paraglide

We recommend to use inlang paraglide to globalize your project. It will soon create the project file and the plugin for you automatically as well. Follow the steps in the [paraglideJS](/m/gerre34r/library-inlang-paraglideJs) to get started.

## Manual setup with existing i18n library

If you already use a i18n library, you can still use the inlang ecosystem. You just need to create the `project.inlang.json` file in the root of your project and install a suitable [inlang plugin via the marketplace](/).

### Create project file

The `project.inlang.json` file must contain the following JSON:

```ts
{
  // the schema version of the project file
  "$schema": "https://inlang.com/schema/project-settings",
  // the "source" language tag that is used in your project
  "sourceLanguageTag": string,
  // all the language tags you want to support in your project
  "languageTags": Array<string>,
  // the modules that are used in the project
  "modules": Array<string>,
}
```

Now you can install the suitable plugin from the [marketplace](/).

<doc-links>
    <doc-link title="Explore the ecosystem" icon="material-symbols:add-business-outline-rounded" href="/" description="Start using apps, plugins and lint rules."></doc-link>
</doc-links>
