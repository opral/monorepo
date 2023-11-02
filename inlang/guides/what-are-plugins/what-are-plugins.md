# Wtf are plugins?
An inlang plugin is a small program that can be added to the inlang project to provide apps or the SDK with logic and information. By using plugins, developers can extend their apps without having to build everything from scratch.

### Why do I need plugins?
If you're setting up inlang for your project, you've probably read that you need a plugin that defines a load and save function. These plugins allow the inlang project to access translation storage, which is essential for inlang to work. There are also plugins that define custom APIs that are useful in specific apps. It's important to choose the right plugin to meet your needs.

### Use Cases
- `load` & `save`: Let the inlang project access the storage layer (e.g. [message-format](https://inlang.com/m/reootnfj/plugin-inlang-messageFormat))
- `matcher`: Let the ide-extension match the i18n library syntax (e.g. [m-function-matcher](https://inlang.com/m/632iow21/plugin-inlang-mFunctionMatcher))
- ...

### Why are plugins great?
Inlang project architecture is more flexible with the use of plugins. This means that you can use it without having to switch to another storage solution. You can customize and expand app or project behaviors easily. This gives you more freedom and keeps adoption costs low.

### How can I add plugins?
Here are two ways to do this:
- You can use the web interface by going to a plugin page, such as the [message-format plugin](https://inlang.com/m/reootnfj/plugin-inlang-messageFormat), and clicking on `Install Plugin`. Then, you'll need to add the repo URL. This will automatically install the plugin into your `project.inlang.json` file. Please note that a `project.inlang.json` file is required for this method. Under the hood this creates a pull request.
-  Alternatively, you can add the plugin manually by referring to the [Getting started guide](https://inlang.com/g/49fn9ggo/guide-niklasbuchfink-howToSetupInlang).

### Links
-> Look for plugins at [inlang.com](https://inlang.com/c/application)
-> Do you want to write a plugin? [Guide](https://inlang.com/documentation/develop-plugin)
