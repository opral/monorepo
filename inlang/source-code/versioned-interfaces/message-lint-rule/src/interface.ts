import type { Message } from "@inlang/message";
import type { LanguageTag } from "@inlang/language-tag";
import { Translatable } from "@inlang/translatable";
import { Type, type Static, type TObject } from "@sinclair/typebox";
import type { JSONObject } from "@inlang/json-types";
import {
  _MessageLintRuleId,
  _MessageLintRuleLevel,
  ExternalProjectSettings,
  type ProjectSettings,
} from "@inlang/project-settings";

export type MessageLintLevel = Static<typeof MessageLintLevel>;
export const MessageLintLevel = _MessageLintRuleLevel;

/**
 * The basis of a lint report (required to contruct a lint report union type)
 */
export type MessageLintReport = {
  ruleId: MessageLintRule["id"];
  messageId: Message["id"];
  languageTag: LanguageTag;
  level: MessageLintLevel;
  body: Translatable<string>;
};

/**
 * The message lint rule API.
 *
 * You can use your own settings by extending the type with a generic:
 *
 * ```ts
 * 	type RuleSettings = {
 *  	filePath: string
 * 	}
 *
 * 	const messageLintRule: MessageLintRule<{
 * 		"messageLintRule.your.id": RuleSettings
 * 	}>
 * ```
 */

export type MessageLintRule<
  ExternalSettings extends
    | Record<keyof ExternalProjectSettings, JSONObject>
    | unknown = unknown,
> = Omit<Static<typeof MessageLintRule>, "settingsSchema"> & {
  settingsSchema?: TObject;

  run: (args: {
    message: Message;
    settings: ProjectSettings & ExternalSettings;
    report: (args: {
      messageId: Message["id"];
      languageTag: LanguageTag;
      body: MessageLintReport["body"];
    }) => void;
  }) => MaybePromise<void>;
};
export const MessageLintRule = Type.Object({
  id: _MessageLintRuleId,
  displayName: Translatable(Type.String()),
  description: Translatable(Type.String()),
  /**
   * Tyepbox is must be used to validate the Json Schema.
   * Github discussion to upvote a plain Json Schema validator and read the benefits of Typebox
   * https://github.com/opral/monorepo/discussions/1503
   */
  settingsSchema: Type.Optional(
    Type.Object({}, { additionalProperties: true }),
  ),
});

/**
 * ---------------- UTILITIES ----------------
 */

type MaybePromise<T> = T | Promise<T>;
