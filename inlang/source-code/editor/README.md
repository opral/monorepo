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

# Usage

## Tutorial

[![Fink Guide Ad](https://cdn.jsdelivr.net/gh/inlang/monorepo@latest/inlang/assets/marketplace/editor-guide-image.jpg) Read in-depth guide](/g/6ddyhpoi/guide-nilsjacobsen-contributeTranslationsWithFink)

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
