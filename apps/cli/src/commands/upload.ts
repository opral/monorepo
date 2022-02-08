import {
    adapters,
    SupportedAdapter,
    SerializedResource,
    parseResources,
    serializeResources,
} from '@inlang/fluent-adapters';
import { languageCodes, Result } from '@inlang/common';
import { command } from 'cleye';
import consola from 'consola';
import * as fs from 'fs';
import fetch from 'node-fetch';

export const uploadCommand = command(
    {
        name: 'upload',
        help: {
            description: 'Uploads the local files and OVERWRITES the remote files.',
            examples:
                'inlang upload --adapter fluent --path-pattern ./translations/{languageCode}.ftl --api-key <your api key>',
        },
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
        const localFiles = [];
        for (const languageCode of languageCodes) {
            const file = (parsed.flags.pathPattern as string).replace('{languageCode}', languageCode);
            if (fs.existsSync(file)) {
                localFiles.push({
                    data: fs.readFileSync(file).toString(),
                    languageCode: languageCode,
                });
            }
        }
        if (localFiles.length === 0) {
            consola.error("Couldn't find any files that match the --path-pattern.");
            return;
        }
        const parsedResources = parseResources({
            adapter: adapter,
            files: localFiles,
        });
        if (parsedResources.isErr) {
            consola.error(parsedResources.error);
            return;
        }
        const fluentFiles = serializeResources({ adapter: adapters.fluent, resources: parsedResources.value });
        if (fluentFiles.isErr) {
            consola.error(fluentFiles.error);
            return;
        }
        consola.info('Uploading files...');
        const result = await upload({
            apiKey: parsed.flags.apiKey,
            files: fluentFiles.value,
        });
        if (result.isErr) {
            consola.error(result.error);
            return;
        }
        consola.success('Complete');
    }
);

async function upload(args: { apiKey: string; files: SerializedResource[] }): Promise<Result<void, Error>> {
    const response = await fetch(process.env.API_ENDPOINT + 'upload', {
        method: 'post',
        body: JSON.stringify({ apiKey: args.apiKey, files: args.files }),
        headers: { 'content-type': 'application/json' },
    });
    if (response.ok === false) {
        return Result.err(Error(response.statusText + ': ' + (await response.text())));
    }
    return Result.ok(undefined);
}
