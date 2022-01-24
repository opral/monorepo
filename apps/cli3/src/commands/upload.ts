import { adapters, SupportedAdapter } from '@inlang/adapters';
import { LanguageCode, Result } from '@inlang/common';
import { Resources, SerializedResource } from '@inlang/fluent-syntax';
import { command } from 'cleye';
import consola from 'consola';
import * as fs from 'fs';
import fetch from 'node-fetch';

export const uploadCommand = command(
    {
        name: 'upload',
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
        const resources = Resources.parse({
            adapter: adapter,
            files: localFiles,
        });
        if (resources.isErr) {
            throw resources.error;
        }
        const fluentFiles = resources.value.serialize({ adapter: adapters.fluent });
        if (fluentFiles.isErr) {
            throw fluentFiles.error;
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
    const response = await fetch('http://localhost:3000/api/upload', {
        method: 'post',
        body: JSON.stringify({ apiKey: args.apiKey, files: args.files }),
        headers: { 'content-type': 'application/json' },
    });
    if (response.ok === false) {
        return Result.err(Error(response.statusText + ': ' + (await response.text())));
    }
    return Result.ok(undefined);
}

// maybe put in common?
const languageCodes: LanguageCode[] = [
    'ab',
    'aa',
    'af',
    'ak',
    'sq',
    'am',
    'ar',
    'an',
    'hy',
    'as',
    'av',
    'ae',
    'ay',
    'az',
    'bm',
    'ba',
    'eu',
    'be',
    'bn',
    'bh',
    'bi',
    'bs',
    'br',
    'bg',
    'my',
    'ca',
    'km',
    'ch',
    'ce',
    'ny',
    'zh',
    'cu',
    'cv',
    'kw',
    'co',
    'cr',
    'hr',
    'cs',
    'da',
    'dv',
    'nl',
    'dz',
    'en',
    'eo',
    'et',
    'ee',
    'fo',
    'fj',
    'fi',
    'fr',
    'ff',
    'gd',
    'gl',
    'lg',
    'ka',
    'de',
    'ki',
    'el',
    'kl',
    'gn',
    'gu',
    'ht',
    'ha',
    'he',
    'hz',
    'hi',
    'ho',
    'hu',
    'is',
    'io',
    'ig',
    'id',
    'ia',
    'ie',
    'iu',
    'ik',
    'ga',
    'it',
    'ja',
    'jv',
    'kn',
    'kr',
    'ks',
    'kk',
    'rw',
    'kv',
    'kg',
    'ko',
    'kj',
    'ku',
    'ky',
    'lo',
    'la',
    'lv',
    'lb',
    'li',
    'ln',
    'lt',
    'lu',
    'mk',
    'mg',
    'ms',
    'ml',
    'mt',
    'gv',
    'mi',
    'mr',
    'mh',
    'ro',
    'mn',
    'na',
    'nv',
    'nd',
    'ng',
    'ne',
    'se',
    'no',
    'nb',
    'nn',
    'ii',
    'oc',
    'oj',
    'or',
    'om',
    'os',
    'pi',
    'pa',
    'ps',
    'fa',
    'pl',
    'pt',
    'qu',
    'rm',
    'rn',
    'ru',
    'sm',
    'sg',
    'sa',
    'sc',
    'sr',
    'sn',
    'sd',
    'si',
    'sk',
    'sl',
    'so',
    'st',
    'nr',
    'es',
    'su',
    'sw',
    'ss',
    'sv',
    'tl',
    'ty',
    'tg',
    'ta',
    'tt',
    'te',
    'th',
    'bo',
    'ti',
    'to',
    'ts',
    'tn',
    'tr',
    'tk',
    'tw',
    'ug',
    'uk',
    'ur',
    'uz',
    've',
    'vi',
    'vo',
    'wa',
    'cy',
    'fy',
    'wo',
    'xh',
    'yi',
    'yo',
    'za',
    'zu',
];
