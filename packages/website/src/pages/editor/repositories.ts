/**
 * Showcased repositories that are using inlang.
 *
 * If you want to showcase your repository, edit the following
 * list and add your repository below.
 */
export const repositories: Repositories = [
	{
		owner: "inlang",
		repository: "example",
		description: "Example repository that showcases inlang.",
	},
];

type Repositories = Array<{
	owner: string;
	repository: string;
	description: string;
}>;
