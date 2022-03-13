<script lang="ts">
	import { onMount } from 'svelte';
	import git from 'isomorphic-git';
	import http from 'isomorphic-git/http/web';
	import FS from '@isomorphic-git/lightning-fs';
	import type { Resources } from '@inlang/fluent-ast';
	import { readResources } from '@inlang/utils';
	import type { Result } from '@inlang/utils';

	let resources: Result<Resources>;

	onMount(async () => {
		// import { readTranslationFiles } from '../utils/readTranslationFiles';
		const fs = new FS('demo');
		const fsp = fs.promises;

		// const dir = '/Users/samuel/Documents/GitHub.nosync/playground';
		const dir = '/test-clone';
		// eslint-disable-next-line unicorn/no-await-expression-member
		if ((await fsp.readdir('/')).length === 0) {
			console.log('creating directory ' + dir);
			await fsp.mkdir(dir);
		}
		console.log({ fsls: await fsp.readdir(dir) });
		console.log({
			clone: await git.clone({
				fs,
				http,
				url: 'https://github.com/inlang/awesome-fluent-i18n',
				dir: '/',
				corsProxy: 'https://cors.isomorphic-git.org'
			})
		});
		console.log({ fsls: await fsp.readdir('/') });
		console.log({ fsls: await fsp.readdir('/test-clone') });
		resources = await readResources({
			fs: fsp,
			directory: '/examples/svelte-kit',
			pathPattern: './static/translations/{languageCode}.ftl',
			fileFormat: 'fluent'
		});
		console.log({ resources });

		if (resources.isOk) {
			console.log(resources.value);
		}
	});
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>
