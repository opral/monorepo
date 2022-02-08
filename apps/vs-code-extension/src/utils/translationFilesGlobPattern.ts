import { InlangConfig01 } from '@inlang/config';
import path from 'path';

export function translationFilesGlobPattern(args: {
  cwd: string;
  pathPattern: InlangConfig01['pathPattern'];
}): string {
  // the highest commonality in the path
  // example: "./translations/{languageCode}.ftl" -> "./translations/"
  const pathPatternDirectory = args.pathPattern.slice(
    0,
    args.pathPattern.indexOf('{languageCode}')
  );
  return path.resolve(args.cwd, pathPatternDirectory) + '/**';
}
