import { Command, Option } from 'commander';
import consola from 'consola';
import {
    converters,
    parseResources,
    SerializedResource,
    serializeResources,
    SupportedConverter,
} from '@inlang/fluent-format-converters';
import fs from 'fs';
import { Result } from '@inlang/utils';
import fetch from 'node-fetch';
import dedent from 'dedent';
import prompts from 'prompts';

export const download = new Command()
    .command('download')
    .description('Downloads the translations and OVERWRITES the local translation files.')
    .addOption(
        new Option('--format <format>').choices(
            Object.keys({ fluent: '', 'localizable-strings': '' })
        )
    )
    .requiredOption(
        '--path-pattern <path>',
        dedent`
          Where and how the translation files should be saved.
            @examples
            './translations/{languageCode}.json'
            './{languageCode}/Localizable.strings'
        `
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
        // start confirmation
        const response = await prompts({
            type: 'confirm',
            name: 'confirm',
            initial: false,
            message: dedent`
              ⚠️ Local translation files will be overwritten!
                Inlang does not support merging yet. See https://github.com/inlang/inlang/discussions/101

                Continue?
            `,
        });
        if (response.confirm === false) {
            return;
        }
        // end confirmation
        const converter = converters[options.format as SupportedConverter];
        consola.info('Downloading files...');
        const fluentFiles = await getRemoteFiles({ apiKey: options.apiKey });
        if (fluentFiles.isErr) {
            consola.error(fluentFiles.error);
            return;
        }
        const resources = parseResources({
            converter: converters.fluent,
            files: fluentFiles.value,
        });
        if (resources.isErr) {
            consola.error(resources.error);
            return;
        }
        const toBeSavedFiles = serializeResources({
            converter,
            resources: resources.value,
        });
        if (toBeSavedFiles.isErr) {
            consola.error(toBeSavedFiles.error);
            return;
        }
        consola.info('Writing files...');
        for (const file of toBeSavedFiles.value) {
            try {
                fs.mkdirSync(
                    (options.pathPattern as string).split('/').slice(0, -1).join('/'),
                    {
                        recursive: true,
                    }
                );
                fs.writeFileSync(
                    (options.pathPattern as string).replace(
                        '{languageCode}',
                        file.languageCode
                    ),
                    file.data
                );
            } catch (error) {
                consola.error(error);
                return;
            }
        }
        consola.success('Complete');
    });

async function getRemoteFiles(args: {
    apiKey: string;
}): Promise<Result<SerializedResource[], Error>> {
    try {
        const response = await fetch(process.env.API_ENDPOINT + 'download', {
            method: 'post',
            body: JSON.stringify({ apiKey: args.apiKey }),
            headers: { 'content-type': 'application/json' },
        });
        if (response.ok === false) {
            return Result.err(
                Error(response.statusText + ': ' + (await response.text()))
            );
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body: any = await response.json();
        return Result.ok(body.files);
    } catch (error) {
        return Result.err(error as Error);
    }
}
