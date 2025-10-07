import { act, render, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { useEffect } from "react";
import { useComposerState } from "./composer-state";
import { MOCK_COMMANDS } from "./commands";

const TEST_FILES = ["docs/readme.md", "src/app.ts", "README.md"];

type Snapshot = ReturnType<typeof useComposerState> | null;

describe("useComposerState", () => {
	test("filters commands when slash input is provided", async () => {
		let snapshot: Snapshot = null;
		const onRender = vi.fn((state: Snapshot) => {
			snapshot = state;
		});

		render(<HookHarness onRender={onRender} />);
		await waitFor(() => expect(snapshot).not.toBeNull());
		act(() => {
			snapshot!.setValue("/h");
		});
		await waitFor(() => expect(snapshot!.value).toBe("/h"));
		act(() => {
			snapshot!.setSlashOpen(true);
		});
		await waitFor(() => {
			const names = snapshot!.filteredCommands.map((cmd) => cmd.name);
			expect(names).toContain("help");
		});
	});

	test("slashToken is null for file-like mentions", async () => {
		let snapshot: Snapshot = null;
		render(<HookHarness onRender={(state) => (snapshot = state)} />);
		await waitFor(() => expect(snapshot).not.toBeNull());
		act(() => {
			snapshot!.setValue("/docs/readme.md");
		});
		await waitFor(() => expect(snapshot!.slashToken).toBeNull());
	});

	test("slashToken is null once whitespace follows the command", async () => {
		let snapshot: Snapshot = null;
		render(<HookHarness onRender={(state) => (snapshot = state)} />);
		await waitFor(() => expect(snapshot).not.toBeNull());
		act(() => {
			snapshot!.setValue("/clear done");
		});
		await waitFor(() => expect(snapshot!.slashToken).toBeNull());
	});

	test("opens mention list when @ is typed", async () => {
		let snapshot: Snapshot = null;
		render(<HookHarness onRender={(state) => (snapshot = state)} />);
		await waitFor(() => expect(snapshot).not.toBeNull());
		act(() => {
			snapshot!.setValue("@");
		});
		await waitFor(() => expect(snapshot!.value).toBe("@"));
		act(() => {
			snapshot!.updateMentions({ selectionStart: 1 } as HTMLTextAreaElement);
		});
		await waitFor(() => expect(snapshot!.mentionOpen).toBe(true));
		expect(snapshot!.mentionItems.length).toBeGreaterThan(0);
	});

	test("pushHistory keeps a capped history", () => {
		let snapshot: Snapshot = null;
		render(<HookHarness onRender={(state) => (snapshot = state)} />);

		for (let i = 0; i < 25; i++) {
			act(() => snapshot!.pushHistory(`message-${i}`));
		}
		expect(snapshot!.history.length).toBe(20);
		expect(snapshot!.history[0]).toBe("message-24");
	});
});

function HookHarness({ onRender }: { onRender: (state: Snapshot) => void }) {
	const state = useComposerState({
		commands: MOCK_COMMANDS,
		files: TEST_FILES,
	});
	useEffect(() => {
		onRender(state);
	}, [state, onRender]);
	return null;
}
