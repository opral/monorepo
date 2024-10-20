import type {
  MessageLintRule,
  MessageLintReport,
} from "@inlang/message-lint-rule";
import type { Message } from "@inlang/message";
import { MessagedLintRuleThrowedError } from "./errors.js";
import type { ProjectSettings } from "@inlang/project-settings";

/**
 * Lint a single message.
 *
 * - the lint rule levels defaults to `warning`.
 */
export const lintSingleMessage = async (args: {
  settings: ProjectSettings &
    Required<Pick<ProjectSettings, "messageLintRuleLevels">>;
  rules: MessageLintRule[];
  messages: Message[];
  message: Message;
}): Promise<{
  data: MessageLintReport[];
  errors: MessagedLintRuleThrowedError[];
}> => {
  const reports: MessageLintReport[] = [];
  const errors: MessagedLintRuleThrowedError[] = [];

  const promises = args.rules.map(async (rule) => {
    const level = args.settings.messageLintRuleLevels?.[rule.id];

    if (level === undefined) {
      throw Error("No lint level provided for lint rule: " + rule.id);
    }

    try {
      await rule.run({
        message: args.message,
        settings: args.settings,
        report: (reportArgs) => {
          reports.push({
            ruleId: rule.id,
            level,
            messageId: reportArgs.messageId,
            languageTag: reportArgs.languageTag,
            body: reportArgs.body,
          });
        },
      });
    } catch (error) {
      errors.push(
        new MessagedLintRuleThrowedError(
          `Lint rule '${rule.id}' throwed while linting message "${args.message.id}".`,
          { cause: error },
        ),
      );
    }
  });

  await Promise.all(promises);

  // we sort the reports by rule id to allow us to easyly compare both
  const sortedReports = reports.sort((r1, r2) =>
    r1.ruleId.localeCompare(r2.ruleId),
  );

  return { data: sortedReports, errors };
};
