import { languageCodes, Result } from '@inlang/common';
import { SupportedAdapter, adapters, parseResources } from '@inlang/fluent-adapters';
import { Resources } from '@inlang/fluent-syntax';
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
  fileFormat: SupportedAdapter;
}): Result<Resources, Error> {
  const adapter = adapters[args.fileFormat];
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
    adapter: adapter,
    files: localFiles,
  });
}
