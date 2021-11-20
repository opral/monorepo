import * as fluent from '@fluent/syntax';
import { AdapterInterface } from '../types/adapterInterface';
import { Result } from '../types/result';
import * as peggy from 'peggy';

export class Typesafei18nAdapter implements AdapterInterface {
    parse(data: string): Result<fluent.Resource, Error> {
        try {
            const recourse = fluent.parse(peggy.generate(grammar).parse(data), {});
            const junk = recourse.body.filter((entry) => entry.type === 'Junk');
            if (junk.length > 0) {
                return Result.err(Error("Couldn't parse the following entries:\n" + junk.map((junk) => junk.content)));
            }
            return Result.ok(fluent.parse(peggy.generate(grammar).parse(data), { withSpans: false }));
        } catch (e) {
            return Result.err(e as Error);
        }
    }

    serialize(resource: fluent.Resource): Result<string, Error> {
        let result = `/* eslint-disable */
import type { Translation } from '../i18n-types';

const de: Translation = {
`;
        const entries = resource.body.map((entry) => {
            if (entry.type === 'Message' || entry.type === 'Term') {
                return entry.value?.elements.reduce((prev, element) => {
                    if (element.type === 'TextElement') {
                        return prev + element.value;
                    } else {
                        if (element.expression.type === 'VariableReference') {
                            return prev + '{' + element.expression.id.name + '}';
                        }
                    }
                    return prev;
                }, '');
            }
        });
        for (const entry of entries) {
            result += entry + '\n';
        }
        result += `};

export default de;`;
        return Result.ok(result);
    }
}

const grammar = String.raw`
JSON_text
	= [^=]* "=" output:value [^\0]* {
		function recursiveNesting(obj, namespace) {
        	return Object.keys(obj).reduce((prev, element) => {
              if (typeof obj[element] === 'string') {
                  return prev + namespace + element + " = " + obj[element] + "\n"
              } else {
              	  return prev + recursiveNesting(obj[element], namespace + element + "-");
              }
            }, "");
  		}

        return recursiveNesting(output, "")
	}

begin_object = ws "{" ws
end_object = ws "}" ws
value_separator = ws "," ws
name_separator = ws ":" ws

ws "whitespace" = [ \t\n\r]*

object
  = begin_object
    members:(
      head:member
      tail:(value_separator @member)*
      {
        let result = {};

        [head].concat(tail).forEach(function(element) {
          result[element.name.replace(/'|"/g, "")] = element.value;
        });

        return result
      }
    )?
    (value_separator / ws)
    end_object
    { return members !== null ? members: {}; }

member
  = key:key name_separator value:value {
      return { name: key, value: value };
    }

key "key"
  = chars:keyName* { return chars.join(""); }

string 'string'
	= "'" chars:char* "'" { return chars.join("") }

keyName
  = [a-z_'"]

variableChars
  = [a-z:]

char
  = variable
  / unescaped
  / escape
    sequence:(
        '"'
      / "\\"
      / "/"
      / "b" { return "\b"; }
      / "f" { return "\f"; }
      / "n" { return "\n"; }
      / "r" { return "\r"; }
      / "t" { return "\t"; }
    )
    { return sequence; }

variable
  = "{" chars:variableChars* "}" { return "{$" + chars.join("").split(':')[0] + "}"; }

unescaped
  = [^\0-\x1F\x22\x5C']

escape
  = "\\"

value
  = object
  / string
`;
