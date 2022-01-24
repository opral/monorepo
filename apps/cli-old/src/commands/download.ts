import { Command, flags } from '@oclif/command';
import { download } from '../api/download';
import * as fs from 'fs';
import { Resources } from '@inlang/fluent-syntax';
import { adapters, SupportedAdapter } from '@inlang/adapters';

export default class Download extends Command {
  static description = 'Download the resources for a specific project.';

  static examples = [];

  static flags = {
    adapter: flags.string({
      description: `The adapter used to parse and serialize the syntax used for the translation files to and from Fluent syntax.`,
      options: Object.keys(adapters),
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
    'api-key': flags.string({
      description: 'The api key for the project.',
      required: true,
    }),
  };

  static args = [{ name: 'file' }];

  async run(): Promise<void> {
    const { flags } = this.parse(Download);
    const adapter = adapters[flags.adapter as SupportedAdapter];
    const fluentFiles = await download({ apiKey: flags['api-key'] });
    if (fluentFiles.isErr) {
      throw fluentFiles.error;
    }
    const resources = Resources.parse({ adapter: adapters.fluent, files: fluentFiles.value });
    if (resources.isErr) {
      throw resources.error;
    }
    const localFiles = resources.value.serialize({ adapter });
    if (localFiles.isErr) {
      throw localFiles.error;
    }
    for (const file of localFiles.value) {
      fs.mkdirSync(flags['path-pattern'].split('/').slice(0, -1).join('/'), { recursive: true });
      fs.writeFileSync(flags['path-pattern'].replace('{languageCode}', file.languageCode), file.data);
    }
  }
}
