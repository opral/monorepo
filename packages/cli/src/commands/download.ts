import { Command, flags } from '@oclif/command';
import { download } from '../api/download';
import { getAdapter } from '../lib/adapter';
import * as fs from 'fs';
import { TranslationAPI } from '@inlang/common/src/fluent/formatter';
import { FluentAdapter } from '@inlang/common/src/adapters/fluentAdapter';

export default class Download extends Command {
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
    force: flags.boolean({ description: `Overwrite local translation files regardless of merge conflicts.` }),
  };

  static args = [{ name: 'file' }];

  async run(): Promise<void> {
    const { flags } = this.parse(Download);
    const adapter = getAdapter(flags.adapter);
    if (adapter.isErr) throw adapter.error;

    const result = await download({ adapter: adapter.value, apiKey: flags.apikey });
    if (result.isErr) throw result.error;
    const translationAPI = TranslationAPI.parse({
      adapter: new FluentAdapter(),
      files: result.value,
      baseLanguage: 'en',
    });
    if (translationAPI.isErr) throw translationAPI.error;
    const files = translationAPI.value.serialize(adapter.value);
    if (files.isErr) throw files.error;

    for (const file of files.value) {
      fs.mkdirSync(flags['path-pattern'].split('/').slice(0, -1).join('/'), { recursive: true });

      fs.writeFileSync(flags['path-pattern'].replace('{languageCode}', file.languageCode), file.data);
    }
  }
}
