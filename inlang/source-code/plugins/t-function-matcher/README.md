### Introduction

This plugin provides the integration of `t-functions` into the inlang VSCode extension. It allows you to extract messages from your code, view them inline in the text editor and get lints for your messages.

Match example:
```ts
t('name')
```

### Usage

The plugin will automatically extract messages from your code and show them inline in the editor. You can then click on the message to open the web editor and translate the message.

1. Install the Inlang VSCode extension
2. Add the plugin to your `project.inlang.json` in the `modules` array
3. ✨ See your messages appear inline in the editor

> There might be a delay before the messages appear in the editor. This is because the plugin needs to be downloaded first. If you want to make sure that everything is setup correctly, reload your workspace.