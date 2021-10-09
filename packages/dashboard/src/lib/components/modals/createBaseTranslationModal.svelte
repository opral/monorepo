<script lang="ts">
	// TODO: Error handling

	import { InlineLoading, Modal, TextArea } from 'carbon-components-svelte';
	import type { TranslateRequestBody } from '../../../routes/api/translate';
	import { projectStore } from '$lib/stores/projectStore';
	import { database } from '$lib/services/database';
	import type { definitions } from '@inlang/database';
	import { createEventDispatcher } from 'svelte';
	import { page } from '$app/stores';

	export let open;
	export let key;

	let translation;
	const dispatch = createEventDispatcher();
	let isLoading = 0;

	async function handleTranslation(text: string) {
		isLoading = 1;
		let urls = [];
		for (const l of $projectStore.data.languages) {
			if (l.iso_code !== $projectStore.data.project.default_iso_code) {
				let request: TranslateRequestBody = {
					sourceLang: 'EN',
					targetLang: l.iso_code.toUpperCase(),
					text: text
				};
				urls.push({
					url: '/api/translate',
					params: {
						method: 'post',
						headers: new Headers({ 'content-type': 'application/json' }),
						body: JSON.stringify(request)
					}
				});
			} else {
				console.log(l.iso_code);
				await database.from<definitions['translation']>('translation').insert({
					key_name: key,
					project_id: $projectStore.data.project.id,
					iso_code: $projectStore.data.project.default_iso_code,
					is_reviewed: false,
					text: text
				});
			}
		}
		const requests = urls.map((u) => fetch(u.url, u.params));

		Promise.all(requests)
			.then((responses) => {
				isLoading = 2;
				const errors = responses.filter((response) => !response.ok);

				if (errors.length > 0) {
					throw errors.map((response) => Error(response.statusText));
				}

				const json = responses.map((response) => response.json());

				for (const r of json) {
					r.then(async (v) => {
						console.log(v);
						await database.from<definitions['translation']>('translation').insert({
							key_name: key,
							project_id: $projectStore.data.project.id,
							iso_code: v.targetLang.toLowerCase(),
							is_reviewed: false,
							text: v.text
						});
					});
				}

				isLoading = 3;
				projectStore.getData({ projectId: $page.params.projectId });
				setTimeout(() => {
					isLoading = 0;
					translation = '';
					dispatch('finishBase', key);
					open = false;
				}, 1000);
			})
			.catch((errors) => errors.forEach((isLoading = -1)));
	}
</script>

<Modal
	bind:open
	modalHeading={key}
	size="sm"
	primaryButtonText="Approve"
	secondaryButtonText="Cancel"
	on:click:button--secondary={() => {
		open = false;
	}}
	on:submit={() => {
		handleTranslation(translation);
	}}
	preventCloseOnClickOutside
	shouldSubmitOnEnter={false}
>
	<div class="flex items-center">
		<TextArea labelText="Base translation:" bind:value={translation} />
	</div>
	<p>Text is automatically translated to all project languages.</p>
	{#if isLoading === 1}
		<InlineLoading status="active" description="Auto-translating..." />
	{:else if isLoading === -1}
		<InlineLoading status="error" description="Auto-translating failed" />
	{:else if isLoading === 2}
		<InlineLoading status="finished" description="Auto-translating..." />
		<InlineLoading status="active" description="Submitting..." />
	{:else if isLoading === -2}
		<InlineLoading status="finished" description="Auto-translating..." />
		<InlineLoading status="error" description="Submitting failed" />
	{:else if isLoading === 3}
		<InlineLoading status="finished" description="Auto-translating..." />
		<InlineLoading status="finished" description="Submitting..." />
	{/if}
</Modal>
