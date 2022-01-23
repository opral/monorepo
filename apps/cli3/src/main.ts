import { cli } from 'cleye';
import { Result } from '@inlang/common';

// Parse argv
const argv = cli({
    name: 'greet.js',

    // Define parameters
    parameters: [
        '<first name>', // First name is required
        '[last name]', // Last name is optional
    ],

    // Define flags/options
    flags: {
        // Parses `--time` as a string
        time: {
            type: String,
            description: 'Time of day to greet (morning or evening)',
            default: 'morning',
        },
    },
});

const name = [argv._.firstName, argv._.lastName].filter(Boolean).join(' ');

// const adapter = adapters[flags.adapter as SupportedAdapter];
const x = Result.err();
console.log(x);

if (argv.flags.time === 'morning') {
    console.log(`Good morning ${name}!`);
} else {
    console.log(`Good evening ${name}!`);
}
