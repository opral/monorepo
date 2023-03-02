import { unhandled } from '../utilities/debug.js';
import type {
  LintedNode,
  LintReport,
  LintedResource,
  LintedMessage,
  LintedPattern,
  LintLevel,
} from "./context.js";
import type { LintRuleId } from "./rule.js";

/**
 * Extracts all lint reports that are present on the given node.
 * Per default it will also return lint reports attached to child nodes.
 *
 * @param node the node to extract lint reports from
 * @param nested if set to `false` will just return the lint reports directly attached on this node
 * @returns a list of lint reports
 */
export const getLintReports = (
  node: LintedNode | LintedNode[],
  nested = true
): LintReport[] => {
  if (Array.isArray(node)) {
    return node.flatMap((n) => getLintReports(n, nested));
  }

  const { type } = node;
  switch (type) {
    case "Resource":
      return getLintReportsFromResource(node, nested);
    case "Message":
      return getLintReportsFromMessage(node, nested);
    case "Pattern":
      return getLintReportsFromPattern(node);

    default:
      return unhandled(type, node);
  }
};

const getLintReportsFromResource = (
  { lint, body }: LintedResource,
  nested: boolean
): LintReport[] => [
    ...(lint || []),
    ...(nested
      ? body.flatMap((message) => getLintReportsFromMessage(message, nested))
      : []),
  ];

const getLintReportsFromMessage = (
  { lint, pattern }: LintedMessage,
  nested: boolean
): LintReport[] => [
    ...(lint || []),
    ...(nested ? getLintReportsFromPattern(pattern) : []),
  ];

const getLintReportsFromPattern = ({
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
export const getLintReportsByLevel = (
  level: LintLevel,
  node: LintedNode | LintedNode[],
  nested = true
): LintReport[] =>
  getLintReports(node, nested).filter((report) => report.level === level);

/**
 * Extracts all lint reports with the 'error' lint level that are present on the given node.
 * Per default it will also return lint reports attached to child nodes.
 *
 * @param node the node to extract lint reports from
 * @param nested if set to `false` will just return the lint reports directly attached on this node
 * @returns a list of lint reports
 */
export const getLintErrors = getLintReportsByLevel.bind(
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
export const getLintWarnings = getLintReportsByLevel.bind(
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
export const getLintReportsWithId = (
  id: LintRuleId,
  node: LintedNode | LintedNode[],
  nested = true
): LintReport[] =>
  getLintReports(node, nested).filter((report) => report.id === id);

/**
 * Extracts all lint reports with a certain lint id and the 'error' lint level that are present on the given node.
 * Per default it will also return lint reports attached to child nodes.
 *
 * @param id the lint id to filter
 * @param node the node to extract lint reports from
 * @param nested if set to `false` will just return the lint reports directly attached on this node
 * @returns a list of lint reports
 */
export const getLintErrorsWithId = (
  id: LintRuleId,
  node: LintedNode | LintedNode[],
  nested = true
): LintReport[] =>
  getLintErrors(node, nested).filter((report) => report.id === id);

/**
 * Extracts all lint reports with a certain lint id and the 'warn' lint level that are present on the given node.
 * Per default it will also return lint reports attached to child nodes.
 *
 * @param id the lint id to filter
 * @param node the node to extract lint reports from
 * @param nested if set to `false` will just return the lint reports directly attached on this node
 * @returns a list of lint reports
 */
export const getLintWarningsWithId = (
  id: LintRuleId,
  node: LintedNode | LintedNode[],
  nested = true
): LintReport[] =>
  getLintWarnings(node, nested).filter((report) => report.id === id);

// --------------------------------------------------------------------------------------------------------------------

/**
 * Checks if a given node has lint reports attached to it.
 * Per default it will also return lint reports attached to child nodes.
 *
 * @param node the node to extract lint reports from
 * @param nested if set to `false` will just return the lint reports directly attached on this node
 * @returns `true` iff the given node has lint reports
 */
export const hasLintReports = (node: LintedNode | LintedNode[], nested = true): boolean =>
  getLintReports(node, nested).length > 0;

/**
 * Checks if a given node has lint reports with the 'error' lint level attached to it.
 * Per default it will also return lint reports attached to child nodes.
 *
 * @param node the node to extract lint reports from
 * @param nested if set to `false` will just return the lint reports directly attached on this node
 * @returns `true` iff the given node has lint reports
 */
export const hasLintErrors = (node: LintedNode | LintedNode[], nested = true): boolean =>
  getLintErrors(node, nested).length > 0;

/**
 * Checks if a given node has lint reports with the 'warn' lint level attached to it.
 * Per default it will also return lint reports attached to child nodes.
 *
 * @param node the node to extract lint reports from
 * @param nested if set to `false` will just return the lint reports directly attached on this node
 * @returns `true` iff the given node has lint reports
 */
export const hasLintWarnings = (node: LintedNode | LintedNode[], nested = true): boolean =>
  getLintErrors(node, nested).length > 0;

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
  node: LintedNode | LintedNode[],
  nested = true
): boolean => getLintReportsWithId(id, node, nested).length > 0;

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
  node: LintedNode | LintedNode[],
  nested = true
): boolean => getLintErrorsWithId(id, node, nested).length > 0;

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
  node: LintedNode | LintedNode[],
  nested = true
): boolean => getLintWarningsWithId(id, node, nested).length > 0;
