import { Command, flags } from '@oclif/command';
import { download } from '../api/download';
import { getAdapter } from '../lib/adapter';
import * as fs from 'fs';

export default class Hello extends Command {
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
    apikey: flags.string({ description: 'The apikey of the project found at https://app.inlang.dev/', required: true }),
    force: flags.boolean({ description: `Overwrite local translation files regardless of merge conflicts.` }),
  };

  async run(): Promise<void> {
    const { flags } = this.parse(Hello);
    const adapter = getAdapter(flags.adapter);
    if (adapter.isErr) throw adapter.error;

    const result = await download({ adapter: adapter.value, pathPattern: flags['path-pattern'], apiKey: flags.apikey });
    if (result.isErr) throw result.error;
    for (const file of result.value) {
      fs.writeFileSync(
        flags['path-pattern'].replace('{languageCode}', file.languageCode),
        adapter.value.serialize(file.data)
      );
    }
  }
}
