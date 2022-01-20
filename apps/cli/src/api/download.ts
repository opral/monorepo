import { Result, TranslationFile, AdapterInterface } from '@inlang/common';

export function download(args: {
  adapter: AdapterInterface;
  apiKey: string;
}): Promise<Result<TranslationFile[], Error>> {
  return fetch(
    process.env.VITE_PUBLIC_AUTH_REDIRECT_URL === undefined
      ? 'http://app.inlang.dev/api/download'
      : 'http://localhost:3000/api/download',
    {
      method: 'post',
      body: JSON.stringify({ apiKey: args.apiKey }),
      headers: { 'content-type': 'application/json' },
    }
  )
    .then((res) => res.json())
    .then((json) => Result.ok((json as { files: TranslationFile[] }).files));
}
