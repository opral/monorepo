/**
 * TODO
 * is not working and only commited for initial workprogress!
 */

import * as fluent from '@fluent/syntax';
import * as peggy from 'peggy';
import { AdapterInterface } from '../types/adapterInterface';
import { Result } from '../types/result';

export class SwiftAdapter implements AdapterInterface {
    parse(data: string): Result<fluent.Resource, unknown> {
        try {
            const recourse = fluent.parse(peggy.generate(grammar).parse(data), {});
            const junk = recourse.body.filter((entry) => entry.type === 'Junk');
            if (junk.length > 0) {
                return {
                    data: null,
                    error: "Couldn't parse the following entries:\n" + junk.map((junk) => junk.content),
                };
            }
            return {
                data: fluent.parse(peggy.generate(grammar).parse(data), { withSpans: false }),
                error: null,
            };
        } catch (e) {
            return {
                data: null,
                error: e,
            };
        }
    }

    serialize(resource: fluent.Resource): Result<string, unknown> {
        try {
            return {
                data: fluent.serialize(resource, { withJunk: false }),
                error: null,
            };
        } catch (e) {
            return {
                data: null,
                error: e,
            };
        }
    }
}

const grammar = String.raw`

Result = WS @File WS

File
  = entries:(
      head:Entry
      tail:(WS @Entry)*
      {
        // head is a single element
        // \n for a nicer output.
        let result = "\n" + head;
        // for each element in the tail, append it to the result string
        tail.forEach((element) => {
          result += element;
        });
        return result;
      }
    )

Entry = Message / Comment

Message
  = key:String WS "=" WS value:String ";" {
    // count is -1 to start with 0
  	let count = -1
    value = value.replace(/%d/g, () => {
      count += 1
      return "{ NUMBER($var" + count + ") }"
    })
    return key + " = " + value + "\n"
  }

String
  = QuotationMark chars:Unescaped* QuotationMark {
     return chars.join("");
  }

Comment
  = //SingleHashComment (is not matched for Swift files)
    DoubleHashComment
  / TripleHashComment

DoubleHashComment
  = "//" chars:[^\n]* {
    return "\n## " + chars.join("") + "\n\n"
  }

TripleHashComment
  // match any char if previous chars are not "*/" (comment has ended)
  // and match has to end with "*/" (comment is ending)
  = "/*" chars: [^*/]* "*/" {
    let result = ""
    if (chars[0] === "\n"){
      chars = chars.slice(1, chars.length)
    }
	const lines = chars.join("").split("\n")
    for (const line of lines){
      if (line.length > 1){
        result += "### " + line + "\n"
      }
    }
    return result + "\n"
  }

Unescaped
  = [^\0-\x1F\x22\x5C]

QuotationMark = '"'

WS "whitespace" = [ \t\n\r]*

`;
