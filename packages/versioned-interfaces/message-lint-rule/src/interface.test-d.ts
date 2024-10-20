/* eslint-disable @typescript-eslint/no-unused-vars */
import { Type } from "@sinclair/typebox";
import { MessageLintRule } from "./interface.js";

// -- it should be possible to extend the settings with the lint rule's settings --

type Settings = {
  disabled: boolean;
};

const id = "messageLintRule.placeholder.name";

const messageLintRule: MessageLintRule<{
  [id]: Settings;
}> = {
  id,
  displayName: "Placeholder message lint rule",
  description: "Inlang message lint rule for the message format",
  run: async ({ message, settings, report }) => {
    settings[id] satisfies Settings;
  },
};

// -- it should be possible to use a lint rule without a generic --

const messageLintRule2: MessageLintRule = {} as any;
