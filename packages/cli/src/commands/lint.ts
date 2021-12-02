import { TranslationAPI } from '@inlang/common/src/fluent/formatter';
import { LanguageCode } from '@inlang/common/src/types/languageCode';
import { flags, Command } from '@oclif/command';
import { getAdapter } from '../lib/adapter';
import * as fs from 'fs';
import * as clc from 'cli-color';

export default class Lint extends Command {
  static description = 'Download the translations for a specific project.';

  static examples = [];

  static flags = {
    adapter: flags.string({
      description: `The adapter used to parse from and to inlang's schema.`,
      options: ['swift', 'typesafe-i18n', 'fluent'],
      required: true,
    }),
    'path-pattern': flags.string({
      description:
        'Where and how the translation files should be saved. You can use "{languageCode}" as dynamic value.\n' +
        '[examples]\n' +
        `./translations/{languageCode}.json\n` +
        `./{languageCode}/Localizable.strings`,
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { flags } = this.parse(Lint);
    const adapter = getAdapter(flags.adapter);
    if (adapter.isErr) throw adapter.error;

    const translationFiles = [];
    for (const language of languages) {
      const file = flags['path-pattern'].replace('{languageCode}', language);
      if (fs.existsSync(file)) {
        translationFiles.push({
          data: fs.readFileSync(file).toString(),
          languageCode: language,
        });
      }
    }

    const translationAPI = TranslationAPI.parse({
      adapter: adapter.value,
      baseLanguage: 'en',
      files: translationFiles,
    });
    if (translationAPI.isErr) throw translationAPI.error;
    const missingTranslationsErrors = translationAPI.value.checkMissingTranslations();
    if (missingTranslationsErrors.isErr) throw missingTranslationsErrors.error;
    const missingVariableErrors = translationAPI.value.checkMissingVariables();
    if (missingVariableErrors.isErr) throw missingVariableErrors.error;

    for (const missing of missingTranslationsErrors.value) {
      console.log(`${clc.red(missing.key)} is missing translations for: ${clc.green(missing.languageCodes)}`);
    }
    for (const missing of missingVariableErrors.value) {
      if (missing.missingFromBaseTranslation)
        console.log(`${clc.red(missing.key)} has problems with the variable: ${clc.green(missing.variable)}`);
    }
  }
}

const languages: LanguageCode[] = [
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
