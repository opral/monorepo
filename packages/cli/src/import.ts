import program from 'commander';
import { createClient } from '@supabase/supabase-js';
import { definitions } from '@inlang/database';
import * as fs from 'fs';

// anon local key, thus okay if it's hardcoded
const supabase = createClient(
	'http://localhost:8000',
	'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTYwMzk2ODgzNCwiZXhwIjoyNTUwNjUzNjM0LCJyb2xlIjoiYW5vbiJ9.36fUebxgx1mcBo4s19v0SzqmzunP--hm_hep0uLX0ew'
);

async function entry() {
	const args = process.argv;
	program
		.version('0.1.0')
		.option('-p, --project', 'project id from dashboard')
		.option(
			'-f, --file',
			'file path from locales folder to a specific translation file. Use "." to import all translation files while inside the locales folder'
		)
		.parse(args);

	const argParsed = program.parse(args).opts();
	let pid = args[3];
	let filepath = args[5];
	if (!argParsed.project === null) {
		pid = argParsed.project;
		filepath = argParsed.file;
	}
	if (!pid) {
		console.error('you must give project id with the -p flag');
	}

	//add all locales to list
	const localefiles: Record<string, string> = {};

	if (filepath.includes('.json')) {
		// single file
		const locale = filepath.split('/')[0];
		localefiles[locale] = filepath;
	} else if (filepath === '.') {
		// multiple files
		const locales = fs.readdirSync('./');
		for (const locale of locales) {
			localefiles[locale] = locale.concat('/translation.json');
		}
	} else {
		console.error('Seems like there is an error in the filepath');
	}

	for (const locale in localefiles) {
		// iterate over all locales
		const dataObject: Record<string, string> = JSON.parse(
			fs.readFileSync(localefiles[locale]).toString()
		);

		for (const y in dataObject) {
			//upsert keys
			const upsert = await supabase.from<definitions['key']>('key').upsert({
				project_id: pid,
				name: y,
				description: ''
			});
			console.log('key:', upsert.error);
		}
		for (const z in dataObject) {
			console.log('translation', z);
			//upsert translation
			const upsert = await supabase.from<definitions['translation']>('translation').upsert({
				key_name: z,
				project_id: pid,
				iso_code: <definitions['language']['iso_code']>locale,
				is_reviewed: false,
				text: dataObject[z]
			});
			console.log('translations:', upsert.error);
		}
	}
}

entry();
