import { cli } from 'cleye';
import { downloadCommand } from './commands/download';
import consola from 'consola';
import { uploadCommand } from './commands/upload';

consola.warn(
    'The CLI is in early-alpha, expect breaking changes. Report bugs and open feature requests here https://github.com/inlang/inlang .'
);

try {
    cli(
        {
            name: 'inlang',
            commands: [downloadCommand, uploadCommand],
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
