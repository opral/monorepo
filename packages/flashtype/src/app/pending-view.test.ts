import { describe, expect, test } from "vitest";
import { activatePanelView, upsertPendingView } from "./pending-view";
import type { PanelState } from "./types";
import { FILES_VIEW_KIND, FILE_VIEW_KIND } from "./view-instance-helpers";

describe("pending view helpers", () => {
	test("upsertPendingView replaces the existing pending slot", () => {
		const panel: PanelState = {
			views: [
				{ instance: "files-1", kind: FILES_VIEW_KIND },
				{ instance: "preview-1", kind: FILE_VIEW_KIND, isPending: true },
			],
			activeInstance: "files-1",
		};

		const next = upsertPendingView(panel, {
			instance: "preview-2",
			kind: FILE_VIEW_KIND,
			isPending: true,
		});

		expect(next.views).toHaveLength(2);
		expect(next.views[0]).toMatchObject({ instance: "files-1" });
		expect(next.views[0].isPending).toBeUndefined();
		expect(next.views[1]).toMatchObject({
			instance: "preview-2",
			isPending: true,
		});
		expect(next.activeInstance).toBe("preview-2");
	});

	test("upsertPendingView can preserve the current active tab", () => {
		const panel: PanelState = {
			views: [{ instance: "files-1", kind: FILES_VIEW_KIND }],
			activeInstance: "files-1",
		};

		const next = upsertPendingView(
			panel,
			{ instance: "preview-1", kind: FILE_VIEW_KIND, isPending: true },
			{ activate: false },
		);

		expect(next.activeInstance).toBe("files-1");
	});

	test("activatePanelView finalizes pending status and focuses the tab", () => {
		const panel: PanelState = {
			views: [
				{ instance: "files-1", kind: FILES_VIEW_KIND },
				{ instance: "preview-1", kind: FILE_VIEW_KIND, isPending: true },
			],
			activeInstance: "files-1",
		};

		const next = activatePanelView(panel, "preview-1");

		expect(next.activeInstance).toBe("preview-1");
		expect(next.views[1]).toMatchObject({
			instance: "preview-1",
			isPending: false,
		});
	});

	test("activatePanelView can skip finalizing pending", () => {
		const panel: PanelState = {
			views: [
				{ instance: "files-1", kind: FILES_VIEW_KIND },
				{ instance: "preview-1", kind: FILE_VIEW_KIND, isPending: true },
			],
			activeInstance: "files-1",
		};

		const next = activatePanelView(panel, "preview-1", {
			finalizePending: false,
		});

		expect(next.activeInstance).toBe("preview-1");
		expect(next.views[1]).toMatchObject({
			instance: "preview-1",
			isPending: true,
		});
	});

	test("activatePanelView returns the original panel when the view is missing", () => {
		const panel: PanelState = {
			views: [{ instance: "files-1", kind: FILES_VIEW_KIND }],
			activeInstance: "files-1",
		};

		const next = activatePanelView(panel, "missing");

		expect(next).toBe(panel);
	});
});
