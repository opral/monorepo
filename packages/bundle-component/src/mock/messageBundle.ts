import type { Bundle, Message, Variant } from "@inlang/sdk2";

export const exampleWithoutSelectors: {
  bundles: Bundle[];
  messages: Message[];
  variants: Variant[];
} = {
  bundles: [
    {
      id: "message-bundle-id",
      declarations: [],
    },
  ],
  messages: [
    {
      bundleId: "message-bundle-id",
      id: "message-id-en",
      locale: "en",
      selectors: [],
    },
    {
      bundleId: "message-bundle-id",
      id: "message-id-de",
      locale: "de",
      selectors: [],
    },
  ],
  variants: [
    {
      messageId: "message-id-en",
      id: "variant-id-en-*",
      matches: [],
      pattern: [{ type: "text", value: "{count} new messages" }],
    },
    {
      messageId: "message-id-de",
      id: "variant-id-de-*",
      matches: [],
      pattern: [{ type: "text", value: "{count} neue Nachrichten" }],
    },
  ],
};
