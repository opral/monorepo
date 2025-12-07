import { Extension, type CommandProps } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";

// Extend Commands interface for slash command extension
declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		slashCommands: {
			closeSlashMenu: () => ReturnType;
			deleteSlashCommand: () => ReturnType;
		};
	}
}

export const slashCommandsPluginKey = new PluginKey<SlashCommandState>(
	"slashCommands",
);

export type SlashCommandState = {
	active: boolean;
	query: string;
	range: { from: number; to: number } | null;
};

export type SlashCommandsOptions = {
	onStateChange: (state: SlashCommandState) => void;
};

/**
 * TipTap extension that detects "/" typed anywhere in text and tracks
 * subsequent characters as a filter query for the slash command menu.
 *
 * Does NOT trigger inside code blocks or inline code.
 */
export const SlashCommandsExtension = Extension.create<SlashCommandsOptions>({
	name: "slashCommands",

	addOptions() {
		return {
			onStateChange: () => {},
		};
	},

	addProseMirrorPlugins() {
		const { onStateChange } = this.options;

		return [
			new Plugin({
				key: slashCommandsPluginKey,
				state: {
					init(): SlashCommandState {
						return { active: false, query: "", range: null };
					},
					apply(tr, prev, _oldState, newState): SlashCommandState {
						// Check for explicit close via metadata
						const meta = tr.getMeta(slashCommandsPluginKey);
						if (meta?.close) {
							return { active: false, query: "", range: null };
						}

						// If not active and no text input, keep inactive
						if (!prev.active && !tr.docChanged) {
							return prev;
						}

						const { selection } = newState;
						const { $from } = selection;

						// Don't trigger in code blocks or inline code
						const parentNode = $from.parent;
						if (parentNode.type.name === "codeBlock") {
							if (prev.active) {
								return { active: false, query: "", range: null };
							}
							return prev;
						}

						// Check for inline code mark
						const marks = $from.marks();
						const hasCodeMark = marks.some((m) => m.type.name === "code");
						if (hasCodeMark) {
							if (prev.active) {
								return { active: false, query: "", range: null };
							}
							return prev;
						}

						// Get text before cursor in current text block
						const textBefore = $from.parent.textBetween(
							0,
							$from.parentOffset,
							undefined,
							"\ufffc",
						);

						// Find the last "/" in the text before cursor
						const slashIndex = textBefore.lastIndexOf("/");

						if (slashIndex === -1) {
							// No slash found
							if (prev.active) {
								return { active: false, query: "", range: null };
							}
							return prev;
						}

						// Check if slash is at start of line or after whitespace
						const charBeforeSlash =
							slashIndex > 0 ? textBefore[slashIndex - 1] : null;
						const isValidSlashPosition =
							charBeforeSlash === null ||
							charBeforeSlash === " " ||
							charBeforeSlash === "\t" ||
							charBeforeSlash === "\n";

						if (!isValidSlashPosition) {
							if (prev.active) {
								return { active: false, query: "", range: null };
							}
							return prev;
						}

						// Extract query (text after slash)
						const query = textBefore.slice(slashIndex + 1);

						// Check for space in query (means user finished typing command)
						if (query.includes(" ")) {
							if (prev.active) {
								return { active: false, query: "", range: null };
							}
							return prev;
						}

						// Calculate absolute positions
						const blockStart = $from.start();
						const from = blockStart + slashIndex;
						const to = blockStart + textBefore.length;

						return {
							active: true,
							query,
							range: { from, to },
						};
					},
				},
				view() {
					return {
						update(view: EditorView) {
							const state = slashCommandsPluginKey.getState(view.state);
							if (state) {
								onStateChange(state);
							}
						},
					};
				},
			}),
		];
	},

	addKeyboardShortcuts() {
		return {
			Escape: () => {
				const state = slashCommandsPluginKey.getState(this.editor.state);
				if (state?.active) {
					// Close the menu
					this.editor.view.dispatch(
						this.editor.state.tr.setMeta(slashCommandsPluginKey, {
							close: true,
						}),
					);
					return true;
				}
				return false;
			},
		};
	},

	addCommands() {
		return {
			closeSlashMenu:
				() =>
				({ tr, dispatch }: CommandProps) => {
					if (dispatch) {
						dispatch(tr.setMeta(slashCommandsPluginKey, { close: true }));
					}
					return true;
				},
			deleteSlashCommand:
				() =>
				({ tr, dispatch, state }: CommandProps) => {
					const pluginState = slashCommandsPluginKey.getState(state);
					if (!pluginState?.active || !pluginState.range) {
						return false;
					}
					if (dispatch) {
						dispatch(
							tr
								.delete(pluginState.range.from, pluginState.range.to)
								.setMeta(slashCommandsPluginKey, { close: true }),
						);
					}
					return true;
				},
		};
	},
});
