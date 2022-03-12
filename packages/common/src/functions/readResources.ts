import { languageCodes, Result } from '@inlang/common';
import { converters, parseResources, type SupportedConverter } from '@inlang/fluent-syntax-converters';
import type { Resources } from '@inlang/fluent-syntax';
import path from 'path';
import type FS from '@isomorphic-git/lightning-fs';
import { Buffer } from 'buffer';

/**
 * Reads and parses the local translation files to `Resources`.
 *
 * @args
 * `directory` the path from where the relative `pathPattern` should be resolved
 *
 *
 */
export async function readResources(args: {
    fs: FS.PromisifedFS;
    directory: string;
    pathPattern: string;
    fileFormat: SupportedConverter;
}): Promise<Result<Resources, Error>> {
    const converter = converters[args.fileFormat];
    const localFiles = [];
    for (const languageCode of languageCodes) {
        // named with underscore to avoid name clashing with the imported path module
        const _path = path.resolve(args.directory, args.pathPattern.replace('{languageCode}', languageCode));
        try {
            // https://stackoverflow.com/a/44640785/16690118
            const readFile = Buffer.from(await args.fs.readFile(_path)).toString('utf-8');
            console.log({ readFile });
            localFiles.push({
                data: readFile,
                languageCode: languageCode,
            });
        } catch {
            continue;
        }
    }
    return parseResources({
        converter: converter,
        files: localFiles,
    });
}
