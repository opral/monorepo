import { Command, flags } from '@oclif/command';

export default class Hello extends Command {
  static description = 'Download the translations for a specific project.';

  static examples = [];

  static flags = {
    help: flags.help({ char: 'h' }),
    // flag with a value (-n, --name=VALUE)
    name: flags.string({ name: 'name', description: 'name to print' }),
    // flag with no value (-f, --force)
    force: flags.boolean({ char: 'f' }),
  };

  static args = [{ name: 'file' }];

  async run(): Promise<void> {
    const { args, flags } = this.parse(Hello);

    const name = flags.name ?? 'world';

    this.log(`hello ${name} from ./src/commands/hello.ts`);
    this.warn('h');
    if (args.file && flags.force) {
      this.log(`you input --force and --file: ${args.file}`);
    }
  }
}
