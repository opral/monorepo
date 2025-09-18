import React, { Suspense } from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { expect, test } from "vitest";
import { LixProvider } from "@lix-js/react-utils";
import { openLix, createCheckpoint } from "@lix-js/sdk";
import { plugin as mdPlugin } from "../../../lix/plugin-md/dist";
import { ChangeIndicator } from "./change-indicator";

function Providers({ lix, children }: { lix: any; children: React.ReactNode }) {
	return <LixProvider lix={lix}>{children}</LixProvider>;
}

test("ChangeIndicator shows zero and updates on edit, then resets after checkpoint", async () => {
	const lix = await openLix({ providePlugins: [mdPlugin] });
	const fileId = "ci_file_1";

	// Seed a markdown file
	await lix.db
		.insertInto("file")
		.values({
			id: fileId,
			path: "/ci.md",
			data: new TextEncoder().encode("Hello"),
		})
		.execute();

	// Set the active file id that ChangeIndicator filters by
	await lix.db
		.insertInto("key_value")
		.values({ key: "flashtype_active_file_id", value: fileId })
		.execute();

	// Clear initial working changes by checkpointing first
	await createCheckpoint({ lix });

	await act(async () => {
		render(
			<Suspense>
				<Providers lix={lix}>
					<ChangeIndicator />
				</Providers>
			</Suspense>,
		);
	});

	// Initially, no working changes
	const count0 = await screen.findByTestId("change-count");
	expect(count0).toHaveTextContent(/^0$/);

	// Edit the file content to produce a change in the working change set
	await lix.db
		.updateTable("file")
		.set({ data: new TextEncoder().encode("Hello world") })
		.where("id", "=", fileId)
		.execute();

	// Wait until the indicator reflects the new working change
	await waitFor(async () => {
		const countEl = await screen.findByTestId("change-count");
		const val = parseInt(countEl.textContent || "0", 10);
		expect(Number.isNaN(val) ? 0 : val).toBeGreaterThan(0);
	});

	// Create checkpoint programmatically; indicator should reset to 0
	await act(async () => {
		await createCheckpoint({ lix });
	});
	await waitFor(async () => {
		const countAfter = await screen.findByTestId("change-count");
		expect(countAfter).toHaveTextContent(/^0$/);
	});
});
