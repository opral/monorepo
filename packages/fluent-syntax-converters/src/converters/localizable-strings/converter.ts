/**
 * Interpolation only works with %s (strings)
 */

import peggy from 'peggy';
import { Converter } from '../../types/converter';
import { Result } from '@inlang/common';
import { parse, SingleResource } from '@inlang/fluent-syntax';

export class LocalizableStringsConverter implements Converter {
    parse(args: { data: string }): Result<SingleResource, Error> {
        try {
            const recourse = parse(peggy.generate(grammar).parse(args.data), { withSpans: false });
            const junk = recourse.body.filter((entry) => entry.type === 'Junk');
            if (junk.length > 0) {
                return Result.err(
                    Error(
                        "Couldn't parse the following entries:\n" + junk.map((junk) => junk.content)
                    )
                );
            }
            return Result.ok(recourse);
        } catch (error) {
            return Result.err(error as Error);
        }
    }

    serialize(args: { resource: SingleResource }): Result<string, Error> {
        try {
            let result = '';
            for (const entry of args.resource.body) {
                if (entry.type === 'Comment') {
                    result += `//${entry.content}\n`;
                } else if (entry.type === 'GroupComment') {
                    result += `/*${entry.content}*/\n`;
                } else if (entry.type === 'Message' && entry.value?.elements) {
                    if (entry.comment?.content) {
                        result += `//${entry.comment.content}\n`;
                    }
                    result += `"${entry.id.name}" = "`;
                    for (const element of entry.value.elements) {
                        if (element.type === 'TextElement') {
                            result += element.value;
                        } else if (element.type === 'Placeable') {
                            result += `%s`;
                        } else {
                            throw Error('None exhaustive if statement.');
                        }
                    }
                    result += `";\n`;
                } else {
                    throw Error(`None exhaustive if statement: ${entry.type} is not handled.`);
                }
            }
            return Result.ok(result);
        } catch (error) {
            return Result.err(error as Error);
        }
    }
}

// eslint-disable-next-line unicorn/no-hex-escape
const grammar = String.raw`

 // @ means match whitespace left and right but disregard it
 // i.e. only return the file.
 Result = WS @File WS


 File
   = entries:(
       head:Entry
       // same as above, disregard ws and only return the entry
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
     value = value.replace(/%s/g, () => {
       count += 1
       return "{ $var" + count + " }"
     })
     return key + " = " + value + "\n"
   }

 String
   = QuotationMark chars:Unescaped* QuotationMark {
      return chars.join("");
   }

 Comment
   = SingleHashComment
   / DoubleHashComment
   // TripleHashComment (is not matched for Swift files)

 SingleHashComment
   = "//" chars:[^\n]* {
     return "\n# " + chars.join("") + "\n"
   }

 DoubleHashComment
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
         result += "## " + line + "\n"
       }
     }
     return result + "\n"
   }

 Unescaped
   = [^\0-\x1F\x22\x5C]

 QuotationMark = '"'

 WS "whitespace" = [ \t\n\r]*

 `;
