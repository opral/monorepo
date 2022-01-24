import { Result } from '@inlang/common';
import { SerializedResource } from '@inlang/fluent-syntax';
import fetch from 'node-fetch';

export async function download(args: { apiKey: string }): Promise<Result<SerializedResource[], Error>> {
  const response = await fetch(
    process.env.VITE_PUBLIC_AUTH_REDIRECT_URL === undefined
      ? 'http://app.inlang.dev/api/download'
      : 'http://localhost:3000/api/download',
    {
      method: 'post',
      body: JSON.stringify({ apiKey: args.apiKey }),
      headers: { 'content-type': 'application/json' },
    }
  );
  if (response.ok === false) {
    return Result.err(Error(await response.text()));
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: any = await response.json();
  return Result.ok(body.files);
}
