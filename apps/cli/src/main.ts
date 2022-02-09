import { cli } from 'cleye';
import consola from 'consola';
import { remoteCommand } from './commands/remote/index';

consola.warn(
    'The CLI is in early-alpha, expect breaking changes. Report bugs and open feature requests here https://github.com/inlang/inlang .'
);

try {
    cli(
        {
            name: 'inlang',
            commands: [remoteCommand],
        },
        // by default show help
        // (command `inlang`)
        (parsed) => {
            parsed.showHelp();
        }
    );
} catch (error) {
    consola.error(error);
}
