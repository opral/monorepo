import { Command, Option } from 'commander';
import consola from 'consola';
import { languageCodes, Result } from '@inlang/common';
import {
    converters,
    parseResources,
    SerializedResource,
    serializeResources,
    SupportedConverter,
} from '@inlang/fluent-syntax-converters';
import fs from 'fs';
import fetch from 'node-fetch';

export const upload = new Command()
    .command('upload')
    .description('Uploads the translations and OVERWRITES the remote translation files.')
    .addOption(
        new Option('--format <format>').choices(
            Object.keys({ fluent: '', 'localizable-strings': '' })
        )
    )
    .requiredOption(
        '--path-pattern <path>',
        'Where and how the translation files should be saved. Use "{languageCode}" as dynamic value.\n' +
            '------\n' +
            '[examples]\n' +
            `./translations/{languageCode}.json\n` +
            `./{languageCode}/Localizable.strings`
    )
    .requiredOption('--api-key <key>', 'The api key for the project.')
    .action(async (options) => {
        // start of validation
        if (
            options.format === undefined ||
            Object.keys(converters).includes(options.format) === false
        ) {
            return consola.info(`--format must be one of ${Object.keys(converters)}`);
        } else if ((options.pathPattern as string).match('({languageCode})') === null) {
            return consola.error(`--path-pattern must include "{languageCode}"`);
        }
        // end of validation
        const converter = converters[options.format as SupportedConverter];
        const localFiles = [];
        for (const languageCode of languageCodes) {
            const file = (options.pathPattern as string).replace(
                '{languageCode}',
                languageCode
            );
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
            converter: converter,
            files: localFiles,
        });
        if (parsedResources.isErr) {
            consola.error(parsedResources.error);
            return;
        }
        const fluentFiles = serializeResources({
            converter: converters.fluent,
            resources: parsedResources.value,
        });
        if (fluentFiles.isErr) {
            consola.error(fluentFiles.error);
            return;
        }
        consola.info('Uploading files...');
        const result = await updateRemoteFiles({
            apiKey: options.apiKey,
            files: fluentFiles.value,
        });
        if (result.isErr) {
            consola.error(result.error);
            return;
        }
        consola.success('Complete');
    });

async function updateRemoteFiles(args: {
    apiKey: string;
    files: SerializedResource[];
}): Promise<Result<void, Error>> {
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
