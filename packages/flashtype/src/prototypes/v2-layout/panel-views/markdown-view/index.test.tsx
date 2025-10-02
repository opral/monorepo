import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { MarkdownView } from "./index";

const useQueryTakeFirst = vi.fn();
const setActiveFileId = vi.fn();

vi.mock("@lix-js/react-utils", async () => {
	const actual = await vi.importActual<typeof import("@lix-js/react-utils")>(
		"@lix-js/react-utils",
	);
	return {
		...actual,
		useQueryTakeFirst: (...args: unknown[]) => useQueryTakeFirst(...args),
	};
});

vi.mock("@/key-value/use-key-value", () => ({
	useKeyValue: () => ["existing", setActiveFileId],
}));

vi.mock("@/components/editor/tip-tap-editor", () => ({
	TipTapEditor: () => <div data-testid="tiptap-editor">TipTap</div>,
}));

vi.mock("@/editor/editor-context", async () => {
	const actual = await vi.importActual<
		typeof import("@/editor/editor-context")
	>("@/editor/editor-context");
	return {
		...actual,
		EditorProvider: ({ children }: { children: import("react").ReactNode }) => (
			<div data-testid="editor-provider">{children}</div>
		),
	};
});

describe("MarkdownView", () => {
	beforeEach(() => {
		useQueryTakeFirst.mockReset();
		setActiveFileId.mockReset();
	});

	test("renders an empty state when no file is provided", () => {
		render(<MarkdownView />);
		expect(
			screen.getByText(/select a markdown file to preview/i),
		).toBeInTheDocument();
	});

	test("renders the TipTap editor when file is found", () => {
		useQueryTakeFirst.mockReturnValue({
			id: "file-1",
			path: "/docs/readme.md",
		});

		render(<MarkdownView filePath="/docs/readme.md" />);

		expect(screen.getByTestId("editor-provider")).toBeInTheDocument();
		expect(screen.getByTestId("tiptap-editor")).toBeInTheDocument();
		expect(setActiveFileId).toHaveBeenCalledWith("file-1");
	});

	test("shows a not found message when the file is missing", () => {
		useQueryTakeFirst.mockReturnValue(undefined);

		render(<MarkdownView filePath="/missing.md" />);

		expect(screen.getByText(/file not found/i)).toBeInTheDocument();
		expect(screen.queryByTestId("tiptap-editor")).not.toBeInTheDocument();
	});
});
