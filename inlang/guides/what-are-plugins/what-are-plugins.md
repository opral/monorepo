# What are plugins?

An inlang plugin is a small program that can be added to the inlang project to provide apps or the SDK with logic and information. By using plugins, developers can extend their apps without having to build everything from scratch.

### Why do I need plugins?

If you're setting up inlang for your project, you've probably read that you need a plugin that defines a load and save function. These plugins allow the inlang project to access translation storage, which is essential for inlang to work. There are also plugins that define custom APIs that are useful in specific apps. It's important to choose the right plugin to meet your needs.

### Use Cases

- `load` & `save`: Let the inlang project access the storage layer (e.g. [message-format](https://inlang.com/m/reootnfj/plugin-inlang-messageFormat))
- `matcher`: Let the ide-extension match the i18n library syntax (e.g. [m-function-matcher](https://inlang.com/m/632iow21/plugin-inlang-mFunctionMatcher))
- ...

### Why are plugins great?

Inlang project architecture is more flexible with the use of plugins. This means that you can use it without having to switch to another storage solution. You can customize and expand app or project behaviors easily. This gives you more freedom and keeps adoption costs low.

### How can I install plugins?

Go to https://inlang.com/c/plugins and click install.

### Links

-> Look for plugins at [inlang.com](https://inlang.com/c/apps)
-> Do you want to write a plugin? [Guide](https://inlang.com/documentation/plugin)
