/**
 * TODO
 * is not working and only commited for initial workprogress!
 */

import * as fluent from '@fluent/syntax';
import { AdapterInterface } from '../types/adapterInterface';
import { Result } from '../types/result';

export class SwiftAdapter implements AdapterInterface {
    parse(data: string): Result<fluent.Resource, unknown> {
        try {
            return {
                data: fluent.parse(data, { withSpans: false }),
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

// TODO
// 1. value_separator is missing ";"
// 2. how to deal with swift projects that does not use keys?
const grammar = `
text = ws @translations ws

value_separator = ws

translations
  = translations:(
      head:translation
      tail:(value_separator @translation)*
      {
        let result = "\n";

        [head].concat(tail).forEach((element) => {
          result += element.key + " = " + element.value + "\n";
        });

        return result;
      }
    )

translation
  = key:string ws "=" ws value:string {
  	let count = -1
    value = value.replace(/%d/g, () => {
      count += 1
      return "{ NUMBER($var" + count + ") }"
    })
    return {key: key, value: value}
  }

string
  = quotation_mark chars:unescaped* quotation_mark {
  return chars.join("");
  }



unescaped
  = [^\0-\x1F\x22\x5C]

quotation_mark = '"'

ws "whitespace" = [ \t\n\r]*

`;
