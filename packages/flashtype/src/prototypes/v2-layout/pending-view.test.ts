import { describe, expect, test } from "vitest";
import { activatePanelView, upsertPendingView } from "./pending-view";
import type { PanelState } from "./types";

describe("pending view helpers", () => {
	test("upsertPendingView replaces the existing pending slot", () => {
		const panel: PanelState = {
			views: [
				{ viewKey: "files-1", viewId: "files" },
				{ viewKey: "preview-1", viewId: "file-content", isPending: true },
			],
			activeViewKey: "files-1",
		};

		const next = upsertPendingView(panel, {
			viewKey: "preview-2",
			viewId: "file-content",
			isPending: true,
		});

		expect(next.views).toHaveLength(2);
		expect(next.views[0]).toMatchObject({ viewKey: "files-1" });
		expect(next.views[0].isPending).toBeUndefined();
		expect(next.views[1]).toMatchObject({ viewKey: "preview-2", isPending: true });
		expect(next.activeViewKey).toBe("preview-2");
	});

	test("upsertPendingView can preserve the current active tab", () => {
		const panel: PanelState = {
			views: [{ viewKey: "files-1", viewId: "files" }],
			activeViewKey: "files-1",
		};

		const next = upsertPendingView(
			panel,
			{ viewKey: "preview-1", viewId: "file-content", isPending: true },
			{ activate: false },
		);

		expect(next.activeViewKey).toBe("files-1");
	});

	test("activatePanelView finalizes pending status and focuses the tab", () => {
		const panel: PanelState = {
			views: [
				{ viewKey: "files-1", viewId: "files" },
				{ viewKey: "preview-1", viewId: "file-content", isPending: true },
			],
			activeViewKey: "files-1",
		};

		const next = activatePanelView(panel, "preview-1");

		expect(next.activeViewKey).toBe("preview-1");
		expect(next.views[1]).toMatchObject({ viewKey: "preview-1", isPending: false });
	});

	test("activatePanelView can skip finalizing pending", () => {
		const panel: PanelState = {
			views: [
				{ viewKey: "files-1", viewId: "files" },
				{ viewKey: "preview-1", viewId: "file-content", isPending: true },
			],
			activeViewKey: "files-1",
		};

		const next = activatePanelView(panel, "preview-1", { finalizePending: false });

		expect(next.activeViewKey).toBe("preview-1");
		expect(next.views[1]).toMatchObject({ viewKey: "preview-1", isPending: true });
	});

	test("activatePanelView returns the original panel when the view is missing", () => {
		const panel: PanelState = {
			views: [{ viewKey: "files-1", viewId: "files" }],
			activeViewKey: "files-1",
		};

		const next = activatePanelView(panel, "missing");

		expect(next).toBe(panel);
	});
});
