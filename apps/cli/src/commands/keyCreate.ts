import { TranslationApi, LanguageCode } from '@inlang/common';
import { Command, flags } from '@oclif/command';
import * as fs from 'fs';
import { getAdapter } from '../lib/adapter';

export default class keyCreate extends Command {
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
    key: flags.string({ description: 'The name of the key for the translation key-pairs', required: true }),
    baseTranslation: flags.string({
      description: 'The base translation for the translation key-pairs',
      required: true,
    }),
    baseLanguage: flags.string({ description: 'The base language of the project', required: true }),
  };

  async run(): Promise<void> {
    const { flags } = this.parse(keyCreate);
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

    const translationAPI = TranslationApi.parse({
      adapter: adapter.value,
      baseLanguage: flags.baseLanguage as LanguageCode,
      files: translationFiles,
    });

    if (translationAPI.isErr) throw translationAPI.error;
    const result = translationAPI.value.createKey(flags.key, flags.baseTranslation);
    if (result.isErr) throw result.error;

    const files = translationAPI.value.serialize(adapter.value);
    if (files.isErr) throw files.error;

    for (const file of files.value) {
      fs.writeFileSync(flags['path-pattern'].replace('{languageCode}', file.languageCode), file.data);
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
