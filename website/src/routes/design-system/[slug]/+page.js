/** @type {import('./$types').PageLoad} */
export async function load({ params }) {
	// const post = await import(
	// 	`../../../../../packages/design-system/src/components/Clock/documentation.svx`
	// );
	// const post = await import(`../../../some.svx`);
	// const content = post.default;
	content = "";

	return {
		content,
	};
}
