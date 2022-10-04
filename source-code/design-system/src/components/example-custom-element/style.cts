/**
 * The (base) style of the element.
 */
export const style = [
	{
		// Part(base) is targeted because the `<button>` should be styled,
		// not the `<in-button>` element.
		".button::part(base)": {
			"@apply px-3.5 py-2 mr-2 mb-2 rounded flex items-center gap-1.5 text-sm font-medium":
				"true",
		},
	},
];
