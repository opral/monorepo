import { languageCodes, Result } from '@inlang/utils';
import { converters, parseResources, SupportedConverter } from '@inlang/fluent-format-converters';
import { Resources } from '@inlang/fluent-ast';
import fs from 'fs';
import path from 'path';

/**
 * Reads and parses the local translation files to `Resources`.
 *
 * @args
 * `cwd` the path from where the realtive `pathPattern` should be resolved
 *
 *
 */
export function readTranslationFiles(args: {
  cwd: string;
  pathPattern: string;
  fileFormat: SupportedConverter;
}): Result<Resources, Error> {
  const converter = converters[args.fileFormat];
  const localFiles = [];
  for (const languageCode of languageCodes) {
    // named with underscore to avoid name clashing with the imported path module
    const _path = path.resolve(args.cwd, args.pathPattern.replace('{languageCode}', languageCode));
    if (fs.existsSync(_path)) {
      localFiles.push({
        data: fs.readFileSync(_path).toString(),
        languageCode: languageCode,
      });
    }
  }
  return parseResources({
    converter: converter,
    files: localFiles,
  });
}
