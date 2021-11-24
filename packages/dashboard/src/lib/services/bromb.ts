import { auth } from '$lib/services/auth';

/**
 * Default bromb trigger link with pre-filled metadata.
 *
 * Use whenever you trigger the bromb widget.
 *
 * @param category? the category of the submission
 */
export function brombTriggerLink(args: { category?: 'bug' | 'feedback' | 'message' }): string {
	let result: URL;
	if (args.category) {
		result = new URL(`https://submission.bromb.co/inlang/dashboard/${args.category}`);
	} else {
		result = new URL(`https://submission.bromb.co/inlang/dashboard`);
	}
	const user = auth.user();
	if (user) {
		result.searchParams.append('userId', user.id);
	}
	if (user?.email) {
		result.searchParams.append('email', user.email);
	}
	return result.toString();
}
