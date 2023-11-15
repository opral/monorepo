![editor banner image](https://cdn.jsdelivr.net/gh/inlang/monorepo@main/inlang/source-code/editor/assets/editor-header.png)

# Translate software without having to code.

The editor gives people without deeper technical knowledge the opportunity to work on the translations of software without having to touch code themselves.

<br />

Used by 

<doc-proof organisations="osmosis, appflowy, remnote"></doc-proof>

<doc-comments>
<doc-comment text="The web editor is very well-made! ↹-compatible, fast auto-translate, nice working UI, all good!" author="WarningImHack3r" icon="mdi:github"></doc-comment>
<doc-comment text="Looks like @inlangHQ is going to kill all the translation services with CLI, IDE extension, web editor,  plugins, and CI/CD combo. Amazing." author="Nedim Arabacı" icon="simple-icons:x"></doc-comment>
</doc-comments>
<doc-comment text="I was blown away when I realized that everything in the inlang web editor was done client side." author="Anonym" icon="mdi:discord"></doc-comment>
</doc-comments>

# Benefits
<doc-features>
  <doc-feature text-color="#fff" color="#0991B1" title="Git workflows – in the browser" icon="teenyicons:git-outline"></doc-feature>
  <doc-feature text-color="#fff" color="#0991B1" title="Edit messages visually" icon="teenyicons:chat-outline"></doc-feature>
  <doc-feature text-color="#fff" color="#0991B1" title="Plugin & Lint rule compatible" icon="teenyicons:shield-tick-outline"></doc-feature>
</doc-features>

# Getting started

### 1. Open existing project

To open your existing project, you can visit the [inlang Editor](/editor) and enter your repository URL. The editor will automatically load all your message and plugins / lint rules.

**Depending on the size of your project, it can take up a few seconds to load your project.**

You don't have an inlang project yet? [Read this guide](/g/49fn9ggo/guide-niklasbuchfink-howToSetupInlang) to get started.

### 2. Translate missing messages

After your project is loaded, you can see your messages. Additionally, if your project file includes lint rules, you might encounter warnings for specific keys.

### 3. Push and commit your changes

To save what you've translated, you can use the so called GitFloat menu on the bottom of the page. If you've made changes, you are able to push and commit them. This will automatically create an addition to the git history inside of your repository, which is useful for seeing who has changed what and working on a single source of truth.

# How to filter messages

### Filter after language

You can filter messages shown based on the language selected. You can find the filter on the top right corner of the editor.

### Handle lint rules

Lint rules are a great way to ensure the quality of your translations, therefore you can select the lints you want to use in the editor. You can find it on the top left corner of the editor (filter options).

# Login via GitHub

If your repository can't be accessed anonymously, you can login via GitHub. The editor will ask you to login if it can't access your repository.

# Example

This is how the editor could look like for your project:

<doc-links>
    <doc-link title="Open inlang example" icon="icon-park-outline:editor" href="/editor/github.com/inlang/example" description="inlang example repository in the editor"></doc-link>
</doc-links>
