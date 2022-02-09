import { Command } from 'commander';
import { remote } from './commands/remote/index';

const cli = new Command().name('inlang').addCommand(remote);

if (process.env.PACKAGE_VERSION === undefined) {
    throw Error(
        'Env varibales do not contain package version.' + JSON.stringify(process.env)
    );
}
// adding the version
cli.version(process.env.PACKAGE_VERSION);

cli.parse();
