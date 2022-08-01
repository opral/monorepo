import type { Resource } from '@inlang/fluent-ast';
import type { InlangConfig } from '@inlang/config';
import { converters } from '@inlang/fluent-format-converters';
import path from 'path';
import { Result } from '@inlang/result';
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
    resources: Record<string, Resource | undefined>;
    pathPattern: InlangConfig['latest']['pathPattern'];
    fileFormat: InlangConfig['latest']['fileFormat'];
    languageCodes: InlangConfig['latest']['languageCodes'];
}): Promise<Result<void, Error>> {
    try {
        const converter = converters[args.fileFormat];
        const encoder = new TextEncoder();

        for (const languageCode of args.languageCodes) {
            const resource = args.resources[languageCode];
            if (resource === undefined) {
                return Result.err(new Error(`No resource for language code ${languageCode}`));
            }
            const file = converter.serialize({ resource }).unwrap();
            // _path = avoid clash with imported path module
            const _path = path.resolve(args.directory, args.pathPattern.replace('{languageCode}', languageCode));
            // encode = string to Uint8Array
            await args.fs.writeFile(_path, encoder.encode(file));
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
