import { converters } from '@inlang/fluent-format-converters';
import { Command } from 'commander';
import prompts from 'prompts';
import dedent from 'dedent';
import { InlangConfig01, validate, validatePartially } from '@inlang/config';
import { LanguageCode, languageCodes } from '@inlang/utils';
import path from 'path';
import consola from 'consola';
import fs from 'fs';

export const init = new Command()
    .command('init')
    .description('Get up and running by creating the inlang.config.json file.')
    .action(async () => {
        let config: Partial<InlangConfig01> | InlangConfig01 = {
            $schema:
                'https://raw.githubusercontent.com/inlang/inlang/main/packages/config/src/schemas/v0.1.json',
        };
        consola.info(dedent`
          The init command creates an inlang.config.json with reasonable defaults.
        `);
        // const response1 = await prompts({
        //     type: 'multiselect',
        //     name: 'feature',
        //     message: 'Which apps do you want to setup?',
        //     choices: [
        //         {
        //             title: 'VS Code Extension',
        //             description: 'Extract and see patterns directly in VS Code.',
        //         },
        //     ],
        // });
        const response2 = await prompts({
            type: 'autocomplete',
            name: 'format',
            initial: 'fluent',
            message:
                'What file format is, or will be used for translations in this project?',
            choices: Object.keys(converters)
                .map((name) => ({
                    title: name,
                    value: name,
                }))
                .concat({ title: 'other', value: 'other' }),
        });
        if (response2.format === 'other') {
            return consola.log(
                dedent`
                  Other formats are not yet supported.

                  Good news: Support can be added through converters.
                  Read more at https://inlang.dev/docs/architecture/converters.
                `
            );
        } else {
            config.fileFormat = response2.format;
        }
        const response3 = await prompts([
            {
                type: 'text',
                name: 'pathPattern',
                message: dedent`
                  What is the path pattern of the translation files?

                    @examples
                    ./translations/{languageCode}.ftl
                    ./{languageCode}/Localizable.strings\n\n
                `,
                validate: (value) => {
                    const result = validatePartially({ pathPattern: value });
                    if (result.isErr) {
                        return result.error.message;
                    } else if (
                        existingLanguageCodesInPathPattern({
                            cwd: process.cwd(),
                            pathPattern: value,
                        }).length === 0
                    ) {
                        return dedent`
                          No translation files have been found.

                          If the pattern is correct, create empty files for all language codes you are going to use in this project.
                        `;
                    }
                    return true;
                },
            },
        ]);
        config.pathPattern = response3.pathPattern;
        config = await setupVsCodeExtension({ config: config as InlangConfig01 });
        const configValidation = validate({ config });
        if (configValidation.isErr) {
            return consola.error(configValidation.error.message);
        }
        try {
            fs.writeFileSync(
                process.cwd() + '/inlang.config.json',
                JSON.stringify(config, undefined, 2) // spacing level = 2)
            );
            consola.success('Config file created.');
        } catch (error) {
            consola.error(error);
        }
    });

/**
 *
 * @args
 * `cwd` the path from where the realtive `pathPattern` should be resolved
 */
function existingLanguageCodesInPathPattern(args: {
    cwd: string;
    pathPattern: string;
}): LanguageCode[] {
    const result: LanguageCode[] = [];
    for (const languageCode of languageCodes) {
        // named with underscore to avoid name clashing with the imported path module
        const _path = path.resolve(
            args.cwd,
            args.pathPattern.replace('{languageCode}', languageCode)
        );
        if (fs.existsSync(_path)) {
            result.push(languageCode);
        }
    }
    return result;
}

/**
 * Setup the vscode extension (config).
 *
 * @args config The already existent config values.
 * @returns config extended with values that are required for the extension.
 */
// the required config fields must be filled out before calling this function
async function setupVsCodeExtension(args: {
    config: InlangConfig01;
}): Promise<InlangConfig01> {
    // copying the input object for immutability
    const config: InlangConfig01 = JSON.parse(JSON.stringify(args.config));
    if (config.baseLanguageCode === undefined) {
        const existingLanguageCodes = existingLanguageCodesInPathPattern({
            cwd: process.cwd(),
            pathPattern: config.pathPattern,
        });
        const response = await prompts({
            type: 'autocomplete',
            name: 'baseLanguageCode',
            message: dedent`
              What is the (human) base language code used in this project?

                    The human base language is the human language used during development.
                    In most cases it's English.\n
            `,
            choices: existingLanguageCodes.map((code) => ({ title: code, name: code })),
        });
        config.baseLanguageCode = response.baseLanguageCode;
    }
    if (config.extractPatternReplacementOptions === undefined) {
        /**
         * Outcommented to set a reasonable default and speed up the init command.
         */
        // const response = await prompts({
        //     type: 'text',
        //     name: 'patternOptions',
        //     message: dedent(
        //         `
        //       What is the replacement pattern when extracting a 'pattern'?"

        //             @example
        //             You reference ids with a t() function like so 't("example-id")'.
        //             Then one replacement pattern is 't("{id}")'.
        //     ` + '\n'
        //     ),
        //     validate: (value) => {
        //         const validation = validatePartially({
        //             extractPatternReplacementOptions: [value],
        //         });
        //         if (validation.isErr) {
        //             return validation.error.message;
        //         }
        //         return true;
        //     },
        // });
        // config.extractPatternReplacementOptions = [response.patternOptions];
        config.extractPatternReplacementOptions = ["t('{id}')"];
    }
    if (config.fetchI18nDetectionGrammarFrom === undefined) {
        /**
         * Outcommented to set a reasonable default and speed up the init command.
         */
        // const response = await prompts({
        //     type: 'text',
        //     name: 'fetchI18nDetectionGrammarFrom',
        //     message: 'What is the url to fetch the i18n detection grammar from?',
        //     validate: (value) => {
        //         const validation = validatePartially({
        //             fetchI18nDetectionGrammarFrom: value,
        //         });
        //         if (validation.isErr) {
        //             return validation.error.message;
        //         }
        //         return true;
        //     },
        // });
        // config.fetchI18nDetectionGrammarFrom = response.fetchI18nDetectionGrammarFrom;
        config.fetchI18nDetectionGrammarFrom =
            'https://raw.githubusercontent.com/inlang/inlang/main/packages/i18n-detection/src/grammars/t-function.pegjs';
    }
    return config;
}
