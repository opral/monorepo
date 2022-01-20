import { Result } from '@inlang/common';
import { SerializedResource } from '@inlang/fluent-syntax';
import fetch from 'node-fetch';

export async function upload(args: { apiKey: string; files: SerializedResource[] }): Promise<Result<void, Error>> {
  const response = await fetch(
    process.env.VITE_PUBLIC_AUTH_REDIRECT_URL === undefined
      ? 'http://app.inlang.dev/api/download'
      : 'http://localhost:3000/api/download',
    {
      method: 'post',
      body: JSON.stringify({ apiKey: args.apiKey, files: args.files }),
      headers: { 'content-type': 'application/json' },
    }
  );
  if (response.ok === false) {
    return Result.err(Error(await response.text()));
  }
  return Result.ok(undefined);
}
