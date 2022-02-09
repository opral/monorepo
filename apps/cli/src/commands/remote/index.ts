import { command } from 'cleye';
import { downloadCommand } from './download';
import { uploadCommand } from './upload';

export const remoteCommand = command(
    {
        name: 'remote',
        help: {
            description: 'Commands that ',
        },
        parameters: ['<command>'],
    },
    async (parsed) => {
        switch (parsed._.command) {
            case 'download':
                return console.log('ERROR');
            case 'upload':
                return uploadCommand.callback ? uploadCommand.callback(parsed) : console.log('error');
            default:
                return parsed.showHelp();
        }
    }
);
