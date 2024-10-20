import type { CustomApiInlangIdeExtension, Plugin } from "@inlang/plugin";
import { parse } from "./messageReferenceMatchers.js";

export const ideExtensionConfig = (): ReturnType<
  Exclude<Plugin["addCustomApi"], undefined>
> => ({
  "app.inlang.ideExtension": {
    messageReferenceMatchers: [
      async (args: { documentText: string }) => {
        return parse(args.documentText);
      },
    ],
    extractMessageOptions: [
      {
        callback: (args: { messageId: string }) => {
          return {
            messageId: args.messageId,
            messageReplacement: `{i18n>${args.messageId}}`,
          };
        },
      },
      {
        callback: (args: { messageId: string }) => {
          return {
            messageId: args.messageId,
            messageReplacement: `this.getResourceBundle().getText("${args.messageId}")`,
          };
        },
      },
      {
        callback: (args: { messageId: string }) => {
          return {
            messageId: args.messageId,
            messageReplacement: `{{${args.messageId}}}`,
          };
        },
      },
      {
        callback: (args: { messageId: string }) => {
          return {
            messageId: args.messageId,
            messageReplacement: args.messageId,
          };
        },
      },
    ],
    documentSelectors: [
      { language: "typescript" },
      { language: "javascript" },
      { language: "json" },
      { language: "xml" },
    ],
  } satisfies CustomApiInlangIdeExtension,
});
