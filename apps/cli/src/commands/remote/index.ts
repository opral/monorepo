import { Command } from 'commander';
import { download } from './download';
import { upload } from './upload';

export const remote = new Command()
    .command('remote')
    .description('Interact with remote translation files.')
    .argument('<command>')
    .addCommand(download)
    .addCommand(upload);
