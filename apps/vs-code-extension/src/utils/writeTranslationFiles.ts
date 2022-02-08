import { Result } from '@inlang/common';
import { adapters, serializeResources, SupportedAdapter } from '../../../../packages/fluent-syntax-converters/dist';
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
export function writeTranslationFiles(args: {
  cwd: string;
  resources: Resources;
  pathPattern: string;
  fileFormat: SupportedAdapter;
}): Result<void, Error> {
  const serializedResources = serializeResources({
    resources: args.resources,
    adapter: adapters[args.fileFormat],
  });
  if (serializedResources.isErr) {
    return Result.err(serializedResources.error);
  }
  for (const file of serializedResources.value) {
    try {
      fs.mkdirSync(
        path.resolve(path.dirname(args.cwd), args.pathPattern.split('/').slice(0, -1).join('/')),
        {
          recursive: true,
        }
      );
      fs.writeFileSync(
        path.resolve(
          path.dirname(args.cwd),
          args.pathPattern.replace('{languageCode}', file.languageCode)
        ),
        file.data
      );
    } catch (error) {
      return Result.err(error as Error);
    }
  }
  return Result.ok(undefined);
}
