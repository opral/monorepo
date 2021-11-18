import * as fluent from '@fluent/syntax';
import { AdapterInterface } from '../types/adapterInterface';
import { Result } from '../types/result';
import * as peggyParse from '../adapters/parsers/typesafei18nParser.js';

export class Typesafei18nAdapter implements AdapterInterface {
    parse(data: string): Result<fluent.Resource, unknown> {
        try {
            return {
                data: fluent.parse(peggyParse.parse(data), {}),
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

const peggyGrammar = `
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
    result = {};

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
