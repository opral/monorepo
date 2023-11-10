---
"@inlang/plugin-message-format": major
---

The message format is now human readable and can be edited manually. The plugin will automatically convert the message format to the internal format.

1. Add a filePathPattern property to the inlang project

```diff
"plugin.inlang.messageFormat": {
  "filePath": "./src/messages.json",
+  "pathPattern": "./messages/{languageTag}.json"
}
```

2. Run `npx paraglide-js compile`

The compile command will automatically convert existing messages from the `messages.json` file to the new format.

3. Delete the `messages.json` and `filePath` property in the inlang project

```diff
"plugin.inlang.messageFormat": {
-  "filePath": "./src/messages.json",
  "pathPattern": "./messages/{languageTag}.json"
}
```