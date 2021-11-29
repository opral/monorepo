import { AdapterInterface } from '@inlang/common/src/adapters/index';
import type { TranslationFile } from '@inlang/common/src/types/translationFile';
import { Result } from '@inlang/common/src/types/result';
import fetch from 'node-fetch';

export async function download(args: {
  adapter: AdapterInterface;
  pathPattern: string;
  apiKey: string;
}): Promise<Result<TranslationFile[], Error>> {
  return fetch(process.env.VITE_PUBLIC_AUTH_REDIRECT_URL + '/api/download' ?? 'http://localhost:3000/api/download', {
    method: 'post',
    body: JSON.stringify({ apiKey: args.apiKey }),
    headers: { 'content-type': 'application/json' },
  })
    .then((res) => res.json())
    .then((json) => Result.ok((json as { files: TranslationFile[] }).files));
}
