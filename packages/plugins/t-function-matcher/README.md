### Introduction

This plugin provides the integration of `t-functions` into the inlang Visual Studio Code extension (Sherlock). It allows you to extract messages from your code, view them inline in the text editor and get lints for your messages.

Match examples:
```ts
t('name')
```
```ts
t('start-page:title')
```

### Usage

The plugin will automatically extract messages from your code and show them inline in the editor. You can then click on the message to open the web editor and translate the message.

1. Install the [Visual Studio Code extension (Sherlock)](https://inlang.com/m/r7kp499g)
2. Install this plugin
3. ✨ See your messages appear inline in the editor

> There might be a delay before the messages appear in the editor. This is because the plugin needs to be downloaded first. If you want to make sure that everything is setup correctly, reload your workspace.

