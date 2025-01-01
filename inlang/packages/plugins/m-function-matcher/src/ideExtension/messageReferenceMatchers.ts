/* eslint-disable @typescript-eslint/no-non-null-assertion */
/**
 * Using parsimmon because:
 *
 * 1. Chevrotain is too complicated.
 * 2. TypeScript's compiler doesn't work in the browser.
 * 3. TypeScripts compiler
 */

import Parsimmon from "parsimmon";

const createParser = () => {
  return Parsimmon.createLanguage({
    entry: (r) => {
      return Parsimmon.alt(r.findReference!, Parsimmon.any)
        .many()
        .map((matches) => matches.flatMap((match) => match))
        .map((matches) =>
          matches.filter((item) => typeof item === "object").flat(),
        );
    },

    findReference: function (r) {
      return Parsimmon.seq(
        Parsimmon.string("import * as m"),
        r.findMessage!.many(),
      );
    },

    findMessage: () => {
      return Parsimmon.seqMap(
        Parsimmon.regex(/.*?(?<![a-zA-Z0-9/])m\./s), // no preceding letters or numbers
        Parsimmon.index, // Capture start position
        Parsimmon.regex(/\w+/), // Match the function name
        Parsimmon.index, // Capture end position of function name
        Parsimmon.regex(/\((?:[^()]|\([^()]*\))*\)/).or(Parsimmon.succeed("")), // function arguments or empty string
        (_, start, messageId, end, args) => {
          return {
            messageId: `${messageId}`,
            position: {
              start: {
                line: start.line,
                character: start.column,
              },
              end: {
                line: end.line,
                character: end.column + args.length, // adjust for arguments length
              },
            },
          };
        },
      );
    },
  });
};

// Parse the expression
export function parse(sourceCode: string) {
  try {
    const parser = createParser();
    return parser.entry!.tryParse(sourceCode);
  } catch (e) {
    return [];
  }
}
