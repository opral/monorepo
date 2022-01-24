import { cli } from 'cleye';
import { downloadCommand } from './commands/download';
import consola from 'consola';
import { uploadCommand } from './commands/upload';

try {
    cli(
        {
            name: 'inlang',
            commands: [downloadCommand, uploadCommand],
            version: '0.0.1',
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
