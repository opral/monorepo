import { Command } from 'commander';
import consola from 'consola';
// commands
import { init } from './commands/init';
import { remote } from './commands/remote/index';

if (process.env.PACKAGE_VERSION === undefined) {
    throw Error(
        'Env varibales do not contain package version.' + JSON.stringify(process.env)
    );
}

// starts the cli (entrypoint)
try {
    const cli = new Command()
        .name('inlang')
        .version(process.env.PACKAGE_VERSION)
        .description(
            'The CLI is in early alpha. Expect changes and new commands down the line.'
        )
        .addCommand(init)
        .addCommand(remote);
    cli.parse();
} catch (error) {
    consola.fatal(error);
}
