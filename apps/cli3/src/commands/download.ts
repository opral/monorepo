import { adapters, SupportedAdapter } from '@inlang/adapters';
import { Result } from '@inlang/common';
import { Resources, SerializedResource } from '@inlang/fluent-syntax';
import { command } from 'cleye';
import consola from 'consola';
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
        },
    },
    async (parsed) => {
        // start of validation
        if (Object.keys(adapters).includes(parsed.flags.adapter) === false) {
            parsed.showHelp();
            consola.info(`--adapter must be ${Object.keys(adapters)}`);
            return;
        } else if (parsed.flags.apiKey === undefined) {
            parsed.showHelp();
            consola.info('--api-key is required');
            return;
        } else if (parsed.flags.pathPattern === undefined) {
            parsed.showHelp();
            consola.info('--path-pattern is required');
            return;
        }
        // end of validation
        const adapter = adapters[parsed.flags.adapter as SupportedAdapter];
        consola.info('Downloading files...');
        const fluentFiles = await download({ apiKey: parsed.flags.apiKey });
        if (fluentFiles.isErr) {
            consola.error(fluentFiles.error);
            return;
        }
        const resources = Resources.parse({
            adapter: adapters.fluent,
            files: fluentFiles.value,
        });
        if (resources.isErr) {
            consola.error(resources.error);
            return;
        }
        const toBeSavedFiles = resources.value.serialize({ adapter });
        if (toBeSavedFiles.isErr) {
            consola.error(toBeSavedFiles.error);
            return;
        }
        consola.info('Writing files...');
        for (const file of toBeSavedFiles.value) {
            try {
                fs.mkdirSync((parsed.flags.pathPattern as string).split('/').slice(0, -1).join('/'), {
                    recursive: true,
                });
                fs.writeFileSync(
                    (parsed.flags.pathPattern as string).replace('{languageCode}', file.languageCode),
                    file.data
                );
            } catch (error) {
                consola.error(error);
                return;
            }
        }
        consola.success('Complete');
    }
);

async function download(args: { apiKey: string }): Promise<Result<SerializedResource[], Error>> {
    try {
        const response = await fetch('http://localhost:3000/api/download', {
            method: 'post',
            body: JSON.stringify({ apiKey: args.apiKey }),
            headers: { 'content-type': 'application/json' },
        });
        if (response.ok === false) {
            return Result.err(Error(response.statusText + ': ' + (await response.text())));
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body: any = await response.json();
        return Result.ok(body.files);
    } catch (error) {
        return Result.err(error as Error);
    }
}
