<script lang="ts">
	import { InlineNotification, Modal, TextInput } from 'carbon-components-svelte';
	import { database } from '$lib/services/database';
	import type { definitions } from '@inlang/database';
	import { isValidEmail } from '$lib/utils/isValidEmail';
	import { t } from '$lib/services/i18n';

	export function show(args: {
		projectId: definitions['project']['id'];
		onMemberAdded: () => unknown;
	}): void {
		// automatically overwriting old data when show is called
		projectId = args.projectId;
		onAddedMember = args.onMemberAdded;
		open = true;
	}

	export function hide(): void {
		open = false;
	}

	let open = false;
	let projectId: definitions['project']['id'];

	let onAddedMember: () => unknown;

	let inputEmail = '';

	$: inputIsValidEmail = isValidEmail(inputEmail);

	async function handleInviteUser(): Promise<void> {
		const userId = await database
			.rpc<string>('get_user_id_from_email', { email: inputEmail })
			.single();
		if (userId.error) {
			alert(userId.error.message);
		} else if (userId.data === null) {
			alert($t('not-a-user-yet', { email: inputEmail }));
		} else {
			const memberUpsert = await database
				.from<definitions['project_member']>('project_member')
				.insert({
					project_id: projectId,
					user_id: userId.data
				});
			if (memberUpsert.error) {
				console.error(memberUpsert.error);
				alert(memberUpsert.error.message);
			}
			if (memberUpsert.status === 409) {
				alert($t('already-team-member', { email: inputEmail }));
			} else if (memberUpsert.status === 201) {
				//success
				onAddedMember();
				open = false;
			} else {
				if (memberUpsert.error) {
					alert(memberUpsert.error.message);
				} else {
					alert($t('generic.unknown-error'));
				}
			}
		}
	}
</script>

<Modal
	bind:open
	modalHeading={$t('add-member')}
	primaryButtonText={$t('generic.invite')}
	secondaryButtonText={$t('generic.cancel')}
	primaryButtonDisabled={inputIsValidEmail === false}
	on:click:button--primary={handleInviteUser}
	on:click:button--secondary={() => (open = false)}
>
	<InlineNotification
		kind="info"
		subtitle={$t('invite.member-must-have-account')}
		hideCloseButton
	/>
	<TextInput
		size="xl"
		placeholder={$t('invite.enter-email')}
		bind:value={inputEmail}
		warn={inputEmail.length > 0 && inputIsValidEmail === false}
		warnText={$t('error.invalid-mail')}
	/>
</Modal>
