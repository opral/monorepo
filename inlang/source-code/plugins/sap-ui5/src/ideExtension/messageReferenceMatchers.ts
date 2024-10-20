/* eslint-disable @typescript-eslint/no-non-null-assertion */
import Parsimmon from "parsimmon";

const createParser = () => {
  return Parsimmon.createLanguage({
    i18nBraceExpression: () =>
      Parsimmon.seq(
        Parsimmon.string("{i18n>"),
        Parsimmon.index,
        Parsimmon.regex(/[a-zA-Z0-9_.-]+/),
        Parsimmon.index,
        Parsimmon.string("}"),
      ).map(([, start, key, end]) => ({
        messageId: key,
        position: {
          start: { line: start.line, character: start.column },
          end: { line: end.line, character: end.column },
        },
      })),

    getResourceBundleExpression: () =>
      Parsimmon.seq(
        Parsimmon.string("getResourceBundle().getText("),
        Parsimmon.alt(Parsimmon.string('"'), Parsimmon.string("'")),
        Parsimmon.index,
        Parsimmon.regex(/[a-zA-Z0-9_.-]+/),
        Parsimmon.index,
        Parsimmon.alt(Parsimmon.string('"'), Parsimmon.string("'")),
        Parsimmon.string(")"),
      ).map(([, , start, key, end]) => ({
        messageId: key,
        position: {
          start: { line: start.line, character: start.column },
          end: { line: end.line, character: end.column },
        },
      })),

    doubleBraceExpression: () =>
      Parsimmon.seq(
        Parsimmon.string("{{"),
        Parsimmon.index,
        Parsimmon.regex(/[a-zA-Z0-9_.-]+/),
        Parsimmon.index,
        Parsimmon.string("}}"),
      ).map(([, start, key, end]) => ({
        messageId: key,
        position: {
          start: { line: start.line, character: start.column },
          end: { line: end.line, character: end.column },
        },
      })),

    // A parser to match any content that is not the beginning of a recognized pattern
    anyContent: () => Parsimmon.any,

    // The main parser to find any occurrences of the patterns while skipping other content
    entry: (r) =>
      Parsimmon.alt(
        r.i18nBraceExpression!,
        r.getResourceBundleExpression!,
        r.doubleBraceExpression!,
        r.anyContent!,
      )
        .many()
        .map((matches) => matches.filter((match) => match.messageId)),
  });
};

export function parse(sourceCode: string) {
  const parser = createParser();
  try {
    return parser.entry!.tryParse(sourceCode);
  } catch (error) {
    console.error("Parsing error:", error);
    return [];
  }
}
