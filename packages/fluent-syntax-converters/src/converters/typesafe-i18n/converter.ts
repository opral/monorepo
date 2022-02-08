/* eslint-disable unicorn/no-empty-file */
// import { Converter } from '../../types/converter';
// import { Result, LanguageCode } from '@inlang/common';
// import peggy from 'peggy';
// import { parse, SingleResource } from '@inlang/fluent-syntax';

// export type Typesafei18nConverterOptions = {
//     languageCode: LanguageCode;
//     isBaseLanguage: boolean;
// };

// export class Typesafei18nConverter implements Converter {
//     parse(args: { data: string }): Result<SingleResource, Error> {
//         try {
//             const recourse = parse(peggy.generate(grammar).parse(args.data), {});
//             const junk = recourse.body.filter((entry) => entry.type === 'Junk');
//             if (junk.length > 0) {
//                 return Result.err(
//                     Error(
//                         "Couldn't parse the following entries:\n" + junk.map((junk) => junk.content)
//                     )
//                 );
//             }
//             return Result.ok(parse(peggy.generate(grammar).parse(args.data), { withSpans: false }));
//         } catch (error) {
//             return Result.err(error as Error);
//         }
//     }

//     serialize(
//         args: { resource: SingleResource },
//         options: Typesafei18nConverterOptions
//     ): Result<string, Error> {
//         const translationType = options.isBaseLanguage ? 'BaseTranslation' : 'Translation';
//         let result = `/* eslint-disable */
// import type { ${translationType} } from '../i18n-types';

// const ${options.languageCode}: ${translationType} = {
// `;
//         for (const entry of args.resource.body) {
//             if (entry.type === 'Message' && entry.value?.elements) {
//                 result += `"${entry.id.name}": "`;
//                 for (const element of entry.value.elements) {
//                     if (element.type === 'TextElement') {
//                         result += element.value;
//                     } else if (element.expression.type === 'VariableReference') {
//                         result += `{${element.expression.id.name}}`;
//                     } else {
//                         return Result.err(Error('None exhaustive if statement.'));
//                     }
//                 }
//                 result += `",\n`;
//             } else {
//                 return Result.err(
//                     Error(`None exhaustive if statement: ${entry.type} is not handled.`)
//                 );
//             }
//         }
//         result += `};

// export default de;`;
//         return Result.ok(result);
//     }
// }

// eslint-disable-next-line unicorn/no-hex-escape
// const grammar = String.raw`
// JSON_text
// 	= [^=]* "=" output:value [^\0]* {
// 		function recursiveNesting(obj, namespace) {
//         	return Object.keys(obj).reduce((prev, element) => {
//               if (typeof obj[element] === 'string') {
//                   return prev + namespace + element + " = " + obj[element] + "\n"
//               } else {
//               	  return prev + recursiveNesting(obj[element], namespace + element + "-");
//               }
//             }, "");
//   		}

//         return recursiveNesting(output, "")
// 	}

// begin_object = ws "{" ws
// end_object = ws "}" ws
// value_separator = ws "," ws
// name_separator = ws ":" ws

// ws "whitespace" = [ \t\n\r]*

// object
//   = begin_object
//     members:(
//       head:member
//       tail:(value_separator @member)*
//       {
//         let result = {};

//         [head].concat(tail).forEach(function(element) {
//           result[element.name.replace(/'|"/g, "")] = element.value;
//         });

//         return result
//       }
//     )?
//     (value_separator / ws)
//     end_object
//     { return members !== null ? members: {}; }

// member
//   = key:key name_separator value:value {
//       return { name: key, value: value };
//     }

// key "key"
//   = chars:keyName* { return chars.join(""); }

// string 'string'
// 	= [\'\"] chars:char* [\'\"] { return chars.join("") }

// keyName
//   = [a-z_'"]

// variableChars
//   = [a-z:]

// char
//   = variable
//   / unescaped
//   / escape
//     sequence:(
//         '"'
//       / "\\"
//       / "/"
//       / "b" { return "\b"; }
//       / "f" { return "\f"; }
//       / "n" { return "\n"; }
//       / "r" { return "\r"; }
//       / "t" { return "\t"; }
//     )
//     { return sequence; }

// variable
//   = "{" chars:variableChars* "}" { return "{$" + chars.join("").split(':')[0] + "}"; }

// unescaped
//   = [^\0-\x1F\x22\x5C']

// escape
//   = "\\"

// value
//   = object
//   / string
// `;
