import { adapters, SupportedAdapter } from '@inlang/adapters';
import { Result } from '@inlang/common';
import { Resources, SerializedResource } from '@inlang/fluent-syntax';
import { command } from 'cleye';
import * as fs from 'fs';
import fetch from 'node-fetch';

export const downloadCommand = command(
    {
        name: 'download',
        flags: {
            adapter: {
                description:
                    'Inlang uses Mozillas Fluent syntax. If your environment uses a different translation syntax, you can specify an adapter (to adapt to your environment).',
                type: String,
                default: 'fluent',
            },
            pathPattern: {
                description:
                    'Where and how the translation files should be saved. Use "{languageCode}" as dynamic value.\n' +
                    '[examples]\n' +
                    `./translations/{languageCode}.json\n` +
                    `./{languageCode}/Localizable.strings`,
                type: String,
            },
            apiKey: {
                description: 'The api key for the project.',
                type: String,
            },
            something: String,
        },
    },
    async (parsed) => {
        if (Object.keys(adapters).includes(parsed.flags.adapter) === false) {
            console.error(`--adapter must be ${Object.keys(adapters)}`);
            return;
        }
        const adapter = adapters[parsed.flags.adapter as SupportedAdapter];
        const fluentFiles = await download({ apiKey: parsed.flags.apiKey });
        if (fluentFiles.isErr) {
            console.error(fluentFiles.error);
            return;
        }
        const resources = Resources.parse({
            adapter: adapters.fluent,
            files: fluentFiles.value,
        });
        if (resources.isErr) {
            console.error(resources.error);
            return;
        }
        const localFiles = resources.value.serialize({ adapter });
        if (localFiles.isErr) {
            console.error(localFiles.error);
            return;
        }
        for (const file of localFiles.value) {
            fs.mkdirSync((parsed.flags.pathPattern as string).split('/').slice(0, -1).join('/'), {
                recursive: true,
            });
            fs.writeFileSync(
                (parsed.flags.pathPattern as string).replace('{languageCode}', file.languageCode),
                file.data
            );
        }
    }
);

async function download(args: { apiKey: string }): Promise<Result<SerializedResource[], Error>> {
    const response = await fetch('http://localhost:3000/api/download', {
        method: 'post',
        body: JSON.stringify({ apiKey: args.apiKey }),
        headers: { 'content-type': 'application/json' },
    });
    if (response.ok === false) {
        return Result.err(Error(await response.text()));
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = await response.json();
    return Result.ok(body.files);
}
