import { BlockSelectionPlugin } from "@udecode/plate-selection/react";

export const blockSelectionPlugins = [
	BlockSelectionPlugin.configure(({ editor }) => ({
		options: {
			enableContextMenu: true,
			isSelectable: (element, path) => {
				return (
					!["code_line", "column", "td"].includes(element.type) &&
					!editor.api.block({ above: true, at: path, match: { type: "tr" } })
				);
			},
			onKeyDownSelecting: (event) => {
				// Detect Meta + C (Cmd + C on macOS, Ctrl + C elsewhere)
				const isCopyShortcut =
					(event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "c";

				if (!isCopyShortcut) return;

				// Get selected block nodes from the BlockSelectionPlugin
				// @ts-expect-error - markdown is not in the types
				const selectedNodes = editor.api.blockSelection.getNodes();
				if (!selectedNodes || selectedNodes.length === 0) return;

				// Serialize only the selected block nodes to Markdown
				// @ts-expect-error - markdown is not in the types
				const markdown = editor.api.markdown.serialize({
					nodes: selectedNodes,
				});

				window.navigator.clipboard.writeText(markdown);
				event.preventDefault();
			},
		},
	})),
] as const;

export const blockSelectionReadOnlyPlugin = BlockSelectionPlugin.configure({
	api: {},
	extendEditor: null,
	options: {},
	render: {},
	useHooks: null,
	handlers: {},
});
