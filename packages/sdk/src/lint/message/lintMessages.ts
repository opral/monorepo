import type { Message } from "@inlang/message";
import { lintSingleMessage } from "./lintSingleMessage.js";
import type { MessagedLintRuleThrowedError } from "./errors.js";
import type {
  MessageLintReport,
  MessageLintRule,
} from "@inlang/message-lint-rule";
import type { ProjectSettings } from "@inlang/project-settings";

export const lintMessages = async (args: {
  settings: ProjectSettings &
    Required<Pick<ProjectSettings, "messageLintRuleLevels">>;
  rules: MessageLintRule[];
  messages: Message[];
}): Promise<{
  data: MessageLintReport[];
  errors: MessagedLintRuleThrowedError[];
}> => {
  const promises = args.messages.map((message) =>
    lintSingleMessage({
      ...args,
      message,
    }),
  );

  const results = await Promise.all(promises);

  return {
    data: results.flatMap((result) => result.data).filter(Boolean),
    errors: results.flatMap((result) => result.errors).filter(Boolean),
  };
};
