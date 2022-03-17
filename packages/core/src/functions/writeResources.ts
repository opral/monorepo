import type { Resources } from '@inlang/fluent-ast';
import type { InlangConfig } from '@inlang/config';
import { converters, parseResources, serializeResources } from '@inlang/fluent-format-converters';
import path from 'path';
import { Buffer } from 'buffer';
import { Result } from '@inlang/utils';
import { CommonFsApi } from '../types/commonFsApi';

/**
 * Writes and parses the local translation files to `Resources`.
 *
 * @args
 * `directory` the path from where the relative `pathPattern` should be resolved
 *
 *
 */
export async function writeResources(args: {
    fs: CommonFsApi;
    directory: string;
    resources: Resources;
    pathPattern: InlangConfig['latest']['pathPattern'];
    fileFormat: InlangConfig['latest']['fileFormat'];
    languageCodes: InlangConfig['latest']['languageCodes'];
}): Promise<Result<void, Error>> {
    try {
        const converter = converters[args.fileFormat];
        const toBeSavedFiles = serializeResources({ converter, resources: args.resources }).unwrap();
        const encoder = new TextEncoder();
        for (const file of toBeSavedFiles) {
            // _path = avoid clash with imported path module
            const _path = path.resolve(args.directory, args.pathPattern.replace('{languageCode}', file.languageCode));
            // encode = string to Uint8Array
            await args.fs.writeFile(_path, encoder.encode(file.data));
        }
        return Result.ok(undefined);
    } catch (error) {
        return Result.err(error as Error);
    }
}

// for (const file of toBeSavedFiles.value) {
//     try {
//         fs.mkdirSync(
//             (options.pathPattern as string).split('/').slice(0, -1).join('/'),
//             {
//                 recursive: true,
//             }
//         );
//         fs.writeFileSync(
//             (options.pathPattern as string).replace(
//                 '{languageCode}',
//                 file.languageCode
//             ),
//             file.data
//         );
//     } catch (error) {
//         consola.error(error);
//         return;
//     }
// }
