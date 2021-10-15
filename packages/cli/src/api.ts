import { createClient, PostgrestResponse, SupabaseClient } from '@supabase/supabase-js';
import type { definitions } from '@inlang/database';
import { ensureDirectoryExistence, pgResp2val } from './helpers';
import { readEnvir as readSupaEnvir } from './services/supabase';
import { exportI18nNext } from './adapters/reacti18n';
import * as fs from 'fs';

// let tok = process.env['inlang_KEY'] as string;

export async function download2prj(pid: string) {
	const sb = readSupaEnvir();

	const dbR = await dbReadTrans(sb!, pid);

	// conv.json2file(jsonlist)
	console.log(dbR);

	const exportFs = exportI18nNext({ translations: dbR });
	exportFs.files.forEach((file) => {
		ensureDirectoryExistence(file.path);
		fs.writeFileSync(file.path, JSON.stringify(file.content, null, 4));
	});
}

// https://supabase.io/docs/reference/javascript/select
async function readData(sb: SupabaseClient, loggedInUserId: string, text: string) {
	let progO = await sb
		.from<definitions['project']>('project')
		.select('*')
		.eq('id', loggedInUserId)
		.single();
	// sometable.user.id.
	// return usersO.data
}

async function writeData(sb: SupabaseClient, loggedInUserId: string, text: string, json: String) {
	let { data, error } = await sb.from('messages').upsert({ id: 3 });
	// return data
}

// todo : how to auth?
async function loginWithToken(sb: SupabaseClient, jwt: string) {
	let x = await sb.auth.api.getUser(jwt); // token works
	let user = x.user;
	console.log(x.error);
	return user;
}

async function dbReadProj(sb: SupabaseClient) {
	let prj = (await sb.from<definitions['project']>('project').select('*')).data;
}
async function dbReadTrans(sb: SupabaseClient, projId: string) {
	let translations = await sb
		.from<definitions['translation']>('translation')
		.select('*')
		.match({ id: projId });

	return pgResp2val(translations, 'dbReadTrans');
}

type dbGetArgs = {
	projectId: definitions['project']['id'];
};

export async function dbRead(sb: SupabaseClient, args: dbGetArgs) {
	// table key
	// project
	const project = await sb
		.from<definitions['project']>('project')
		.select('*')
		.match({ id: args.projectId })
		.single();
	// in-efficient to query three times but doesn't matter for now
	const languages = await sb
		.from<definitions['language']>('language')
		.select('*')
		.match({ project_id: args.projectId });

	const keys = await sb
		.from<definitions['key']>('key')
		.select('*')
		.match({ project_id: args.projectId });

	const translations = await sb.from<definitions['translation']>('translation').select('*');
	// .in('key_id', keys.data?.map((key) => key.id) ?? []);
}

// userid => permissions=>projects=>id of translations
// let { data, error } = await sb.from('user').select('user_id, name').eq('user_id', loggedInUserId)

// sb.from("").upsert("", "")

// user
/* let { user, session, error } = await sb.auth.signIn({
    email: 'example@email.com',
    password: 'example-password',
}) */
// user.id
// sb.auth.api.getUserByCookie("")
// user.
