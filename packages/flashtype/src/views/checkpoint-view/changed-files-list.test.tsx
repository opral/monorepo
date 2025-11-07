import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { ChangedFilesList } from "./changed-files-list";

const FILES = [
	{ id: "file-1", path: "/docs/readme.md", status: "modified" as const },
];

describe("ChangedFilesList", () => {
	test("calls openDiffView when clicking a file row", () => {
		const openDiffView = vi.fn();

		render(
			<ChangedFilesList
				files={FILES}
				selectedFiles={new Set()}
				onToggleFile={() => {}}
				onToggleAll={() => {}}
				openDiffView={openDiffView}
			/>,
		);

		const button = screen.getByRole("button", { name: "/docs/readme.md" });
		fireEvent.click(button);

		expect(openDiffView).toHaveBeenCalledWith("file-1", "/docs/readme.md");
	});
});
