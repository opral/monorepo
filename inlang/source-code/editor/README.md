![editor banner image](https://cdn.jsdelivr.net/gh/inlang/monorepo@main/inlang/source-code/editor/assets/editor-header.png)

# Edit translations with version control in a visual editor.

Fink enables translators to edit translations in a visual editor and submit them to your repository. It is a client-side application that pulls the translations from your repository into the browser and commits changes back to it. Contributors can easily submit translations by creating forks and pull requests within the editor.
<br />
<br />

Used by 

<doc-proof organisations="osmosis, appflowy, remnote"></doc-proof>

# Why use Fink?
<doc-features>
  <doc-feature text-color="#0F172A" color="#E1EFF7" title="Edit messages visually" image="https://cdn.jsdelivr.net/gh/inlang/monorepo@latest/inlang/source-code/editor/assets/editor01.png"></doc-feature>
  <doc-feature text-color="#0F172A" color="#E1EFF7" title="Collaborate using version control" image="https://cdn.jsdelivr.net/gh/inlang/monorepo@latest/inlang/source-code/editor/assets/editor02.png"></doc-feature>
  <doc-feature text-color="#0F172A" color="#E1EFF7" title="Ensure quality with lint rules" image="https://cdn.jsdelivr.net/gh/inlang/monorepo@latest/inlang/source-code/editor/assets/editor03.png"></doc-feature>
</doc-features>

<br />
<br />

<doc-comments>
<doc-comment text="The web editor is very well-made! ↹-compatible, fast auto-translate, nice working UI, all good!" author="WarningImHack3r" icon="mdi:github"></doc-comment>
<doc-comment text="Looks like @inlangHQ is going to kill all the translation services with CLI, IDE extension, web editor,  plugins, and CI/CD combo. Amazing." author="Nedim Arabacı" icon="simple-icons:x"></doc-comment>
</doc-comments>
<doc-comment text="I was blown away when I realized that everything in the inlang web editor was done client side." author="Anonym" icon="mdi:discord"></doc-comment>
</doc-comments>

<br />
<br />

# Getting started

Using the Fink editor requires an inlang project.

## A - Existing project.inlang.json

If you already have the `project.inlang.json` file in your repository you can just open the Fink Launcher and paste your GitHub url.

<doc-links>
    <doc-link title="Open Fink Editor" icon="icon-park-outline:editor" href="/editor" description="You can simply open the editor with a remote project."></doc-link>
</doc-links>

## B - Create a new inlang project

- Create a `messages` directory. Let add a example `en.json` in it:
```json
{
  "hello": "Hello World" 
}
```
- Create the `project.inlang.json` file in your root directory. If you want to use another storage plugin choose another plugin at [inlang.com](http://localhost:3000/c/plugins)

```json
{
  "$schema": "https://inlang.com/schema/project-settings",
  "sourceLanguageTag": "en",
  "languageTags": [
    "en"
  ],
  "modules": [
    "https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-empty-pattern@latest/dist/index.js",
    "https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-identical-pattern@latest/dist/index.js",
    "https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-missing-translation@latest/dist/index.js",
    "https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-without-source@latest/dist/index.js",
    "https://cdn.jsdelivr.net/npm/@inlang/plugin-message-format@latest/dist/index.js",
    "https://cdn.jsdelivr.net/npm/@inlang/plugin-m-function-matcher@latest/dist/index.js"
  ],
  "plugin.inlang.messageFormat": {
    "pathPattern": "./messages/{languageTag}.json"
  }
}
```

- Validate project with inlang's cli
```cli
npx @inlang/cli@latest project validate
```
- Push this changes to remote
- Open the editor
```cli
npx @inlang/cli@latest open editor
```


# Usage

### Translate missing messages

After your project is loaded, you can see your messages. Additionally, if your project file includes lint rules, you might encounter warnings for specific keys.

### Push and commit your changes

To save what you've translated, you can use the so called GitFloat menu on the bottom of the page. If you've made changes, you are able to push and commit them. This will automatically create an addition to the git history inside of your repository, which is useful for seeing who has changed what and working on a single source of truth.

### How to filter messages

**Filter after language**

You can filter messages shown based on the language selected. You can find the filter on the top right corner of the editor.

**Handle lint rules**

Lint rules are a great way to ensure the quality of your translations, therefore you can select the lints you want to use in the editor. You can find it on the top left corner of the editor (filter options).

# Login via GitHub

If your repository can't be accessed anonymously, you can login via GitHub. The editor will ask you to login if it can't access your repository.

# Example

This is how the editor could look like for your project:

<doc-links>
    <doc-link title="Open inlang example" icon="icon-park-outline:editor" href="/editor/github.com/inlang/example" description="inlang example repository in the editor"></doc-link>
</doc-links>
