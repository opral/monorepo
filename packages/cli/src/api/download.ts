import { AdapterInterface } from '@inlang/common/src/adapters/index';
import { Result } from '@inlang/common/src/types/result';

export function download(args: {
  adapter: AdapterInterface;
  apiKey: string;
}): Result<void, Error> {
  return Result.ok(undefined);
}
