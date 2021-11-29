import { AdapterInterface } from '@inlang/common/src/adapters/index';
import { Result } from '@inlang/common/src/types/result';

export function download(args: {
  adapter: AdapterInterface;
  pathPattern: string;
  apiKey: string;
}): Result<void, Error> {
  return Result.ok(undefined);
}
