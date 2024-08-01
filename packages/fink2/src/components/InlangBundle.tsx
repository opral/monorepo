import { createComponent } from "@lit/react";
import { InlangBundle } from "@inlang/bundle-component"
import React from "react";

export const MessageBundle = createComponent({
  tagName: "inlang-bundle",
  elementClass: InlangBundle,
  react: React,
  events: {
    changeMessageBundle: "change-message-bundle",
    insertMessage: "insert-message",
    updateMessage: "update-message",

    insertVariant: "insert-variant",
    updateVariant: "update-variant",
    deleteVariant: "delete-variant",
    fixLint: "fix-lint",
  },
})

export default MessageBundle;