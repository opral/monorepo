<doc-header title="What is a Plugin?" description="Change or extend app behavior with custom plugins." button="Get started" link="/documentation/plugin/guide">
</doc-header>

<br/>

![pluginCover](https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/documentation/plugin/assets/plugin-cover.png)

An inlang plugin is a small program that can be added to the inlang project to provide apps or the SDK with logic and information. By using plugins, developers can extend their apps without having to build everything from scratch.

## Why do I need plugins?

If you're setting up inlang for your project, you've probably read that you need a plugin that defines a load and save function. These plugins allow the inlang project to access translation storage, which is essential for inlang to work. There are also plugins that define custom APIs that are useful in specific apps. It's important to choose the right plugin to meet your needs.

## Why are plugins great?

Inlang project architecture is more flexible with the use of plugins. This means that you can use it without having to switch to another storage solution. You can customize and expand app or project behaviors easily. This gives you more freedom and keeps adoption costs low.

## Example

For example, plugin A defines that [messages](/documentation/concept/message) should be stored in a database, while plugin B defines that messages should be stored in a file. An [inlang app](/documentation/concept/app) that uses plugin A will store messages in a database, while an inlang app that uses plugin B will store messages in a file.

![inlang plugin](https://cdn.jsdelivr.net/gh/opral/monorepo/inlang/documentation/sdk/assets/plugin.jpg)

<br/>

<doc-links>
    <doc-link title="API Introduction" icon="mdi:book-open-page-variant" href="/documentation/plugin/api-introduction" description="Read Plugin API Reference."></doc-link>
    <doc-link title="Build a Plugin" icon="mdi:skip-next" href="/documentation/plugin/guide" description="Learn how to build your plugin."></doc-link>
</doc-links>

<br/>
<br/>
