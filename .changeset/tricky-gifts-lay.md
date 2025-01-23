---
"@inlang/plugin-message-format": patch
---

feat: support array of paths for pathPattern in inlang-message-format plugin

```diff
// settings.json

{
  "plugin.inlang.messageFormat": {
+    pathPattern: ["/defaults/{locale}.json", "/translations/{locale}.json"],
  }
}

```