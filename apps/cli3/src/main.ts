import { cli } from 'cleye';
import { downloadCommand } from './commands/download';

cli(
    {
        name: 'inlang',
        commands: [downloadCommand],
        version: '0.0.1',
    },
    // by default show help
    // (command `inlang`)
    (parsed) => {
        parsed.showHelp();
    }
);
