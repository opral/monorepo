import type {
  LintedNode,
  LintReport,
  LintedResource,
  LintedMessage,
  LintedPattern,
  LintLevel,
} from "./context.js";
import type { LintRuleId } from "./rule.js";
import { unhandled } from "./_utilities.js";

/**
 * Extracts all lint reports that are present on the given node.
 * Per default it will also return lint reports attached to child nodes.
 *
 * @param node the node to extract lint reports from
 * @param nested if set to `false` will just return the lint reports directly attached on this node
 * @returns a list of lint reports
 */
export const getAllLintReports = (
  node: LintedNode,
  nested = true
): LintReport[] => {
  const { type } = node;
  switch (type) {
    case "Resource":
      return getAllLintReportsFromResource(node, nested);
    case "Message":
      return getAllLintReportsFromMessage(node, nested);
    case "Pattern":
      return getAllLintReportsFromPattern(node);

    default:
      return unhandled(type, node);
  }
};

const getAllLintReportsFromResource = (
  { lint, body }: LintedResource,
  nested: boolean
): LintReport[] => [
  ...(lint || []),
  ...(nested
    ? body.flatMap((message) => getAllLintReportsFromMessage(message, nested))
    : []),
];

const getAllLintReportsFromMessage = (
  { lint, pattern }: LintedMessage,
  nested: boolean
): LintReport[] => [
  ...(lint || []),
  ...(nested ? getAllLintReportsFromPattern(pattern) : []),
];

const getAllLintReportsFromPattern = ({
  lint,
}: LintedPattern): LintReport[] => lint || [];

// --------------------------------------------------------------------------------------------------------------------

/**
 * Extracts all lint reports with a certain lint level that are present on the given node.
 * Per default it will also return lint reports attached to child nodes.
 *
 * @param level the lint level to filter
 * @param node the node to extract lint reports from
 * @param nested if set to `false` will just return the lint reports directly attached on this node
 * @returns a list of lint reports
 */
export const getAllLintReportsByLevel = (
  level: LintLevel,
  node: LintedNode,
  nested = true
): LintReport[] =>
  getAllLintReports(node, nested).filter((report) => report.level === level);

/**
 * Extracts all lint reports with the 'error' lint level that are present on the given node.
 * Per default it will also return lint reports attached to child nodes.
 *
 * @param node the node to extract lint reports from
 * @param nested if set to `false` will just return the lint reports directly attached on this node
 * @returns a list of lint reports
 */
export const getAllLintErrors = getAllLintReportsByLevel.bind(
  undefined,
  "error"
);

/**
 * Extracts all lint reports with the 'warn' lint level that are present on the given node.
 * Per default it will also return lint reports attached to child nodes.
 *
 * @param node the node to extract lint reports from
 * @param nested if set to `false` will just return the lint reports directly attached on this node
 * @returns a list of lint reports
 */
export const getAllLintWarnings = getAllLintReportsByLevel.bind(
  undefined,
  "warn"
);

// --------------------------------------------------------------------------------------------------------------------

/**
 * Extracts all lint reports with a certain lint id that are present on the given node.
 * Per default it will also return lint reports attached to child nodes.
 *
 * @param id the lint id to filter
 * @param node the node to extract lint reports from
 * @param nested if set to `false` will just return the lint reports directly attached on this node
 * @returns a list of lint reports
 */
export const getAllLintReportsWithId = (
  id: LintRuleId,
  node: LintedNode,
  nested = true
): LintReport[] =>
  getAllLintReports(node, nested).filter((report) => report.id === id);

/**
 * Extracts all lint reports with a certain lint id and the 'error' lint level that are present on the given node.
 * Per default it will also return lint reports attached to child nodes.
 *
 * @param id the lint id to filter
 * @param node the node to extract lint reports from
 * @param nested if set to `false` will just return the lint reports directly attached on this node
 * @returns a list of lint reports
 */
export const getAllLintErrorsWithId = (
  id: LintRuleId,
  node: LintedNode,
  nested = true
): LintReport[] =>
  getAllLintErrors(node, nested).filter((report) => report.id === id);

/**
 * Extracts all lint reports with a certain lint id and the 'warn' lint level that are present on the given node.
 * Per default it will also return lint reports attached to child nodes.
 *
 * @param id the lint id to filter
 * @param node the node to extract lint reports from
 * @param nested if set to `false` will just return the lint reports directly attached on this node
 * @returns a list of lint reports
 */
export const getAllLintWarningsWithId = (
  id: LintRuleId,
  node: LintedNode,
  nested = true
): LintReport[] =>
  getAllLintWarnings(node, nested).filter((report) => report.id === id);

// --------------------------------------------------------------------------------------------------------------------

/**
 * Checks if a given node has lint reports attached to it.
 * Per default it will also return lint reports attached to child nodes.
 *
 * @param node the node to extract lint reports from
 * @param nested if set to `false` will just return the lint reports directly attached on this node
 * @returns `true` iff the given node has lint reports
 */
export const hasLintReports = (node: LintedNode, nested = true): boolean =>
  getAllLintReports(node, nested).length > 0;

/**
 * Checks if a given node has lint reports with the 'error' lint level attached to it.
 * Per default it will also return lint reports attached to child nodes.
 *
 * @param node the node to extract lint reports from
 * @param nested if set to `false` will just return the lint reports directly attached on this node
 * @returns `true` iff the given node has lint reports
 */
export const hasLintErrors = (node: LintedNode, nested = true): boolean =>
  getAllLintErrors(node, nested).length > 0;

/**
 * Checks if a given node has lint reports with the 'warn' lint level attached to it.
 * Per default it will also return lint reports attached to child nodes.
 *
 * @param node the node to extract lint reports from
 * @param nested if set to `false` will just return the lint reports directly attached on this node
 * @returns `true` iff the given node has lint reports
 */
export const hasLintWarnings = (node: LintedNode, nested = true): boolean =>
  getAllLintErrors(node, nested).length > 0;

/**
 * Checks if a given node has lint reports with a certain lint id attached to it.
 * Per default it will also return lint reports attached to child nodes.
 *
 * @param node the node to extract lint reports from
 * @param nested if set to `false` will just return the lint reports directly attached on this node
 * @returns `true` iff the given node has lint reports
 */
export const hasLintReportsWithId = (
  id: LintRuleId,
  node: LintedNode,
  nested = true
): boolean => getAllLintReportsWithId(id, node, nested).length > 0;

/**
 * Checks if a given node has lint reports with a certain lint id and the 'error' lint level attached to it.
 * Per default it will also return lint reports attached to child nodes.
 *
 * @param node the node to extract lint reports from
 * @param nested if set to `false` will just return the lint reports directly attached on this node
 * @returns `true` iff the given node has lint reports
 */
export const hasLintErrorsWithId = (
  id: LintRuleId,
  node: LintedNode,
  nested = true
): boolean => getAllLintErrorsWithId(id, node, nested).length > 0;

/**
 * Checks if a given node has lint reports with a certain lint id and the 'warn' lint level attached to it.
 * Per default it will also return lint reports attached to child nodes.
 *
 * @param node the node to extract lint reports from
 * @param nested if set to `false` will just return the lint reports directly attached on this node
 * @returns `true` iff the given node has lint reports
 */
export const hasLintWarningsWithId = (
  id: LintRuleId,
  node: LintedNode,
  nested = true
): boolean => getAllLintWarningsWithId(id, node, nested).length > 0;
