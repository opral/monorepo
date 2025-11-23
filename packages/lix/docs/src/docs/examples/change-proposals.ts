import {
	openLix,
	createChangeProposal,
	acceptChangeProposal,
	rejectChangeProposal,
} from "@lix-js/sdk";

export default async function runExample(console: any) {
	const lix = await openLix({});

	console.log("SECTION START 'create-proposal'");

	// Get the main version
	const mainVersion = await lix.db
		.selectFrom("version")
		.where("name", "=", "main")
		.select("id")
		.executeTakeFirstOrThrow();

	// Create a feature version for proposed changes
	await lix.db
		.insertInto("version")
		.values({
			name: "feature-typo-fixes",
			parent_version_id: mainVersion.id,
		})
		.execute();

	const featureVersion = await lix.db
		.selectFrom("version")
		.where("name", "=", "feature-typo-fixes")
		.select("id")
		.executeTakeFirstOrThrow();

	// Make some changes in the feature version...
	// (switch to feature version, modify files, etc.)

	// Create a change proposal
	const proposal = await createChangeProposal({
		lix,
		source: { id: featureVersion.id },
		target: { id: mainVersion.id },
	});

	console.log("Change proposal created:", proposal.id);
	console.log("Status:", proposal.status); // "open"

	console.log("SECTION END 'create-proposal'");

	console.log("SECTION START 'query-proposals'");

	// Query all open proposals
	const openProposals = await lix.db
		.selectFrom("change_proposal")
		.where("status", "=", "open")
		.selectAll()
		.execute();

	console.log("Open proposals:", openProposals.length);

	// Query proposals for a specific target version
	const mainProposals = await lix.db
		.selectFrom("change_proposal")
		.where("target_version_id", "=", mainVersion.id)
		.selectAll()
		.execute();

	console.log("Proposals targeting main:", mainProposals.length);

	console.log("SECTION END 'query-proposals'");

	console.log("SECTION START 'accept-proposal'");

	// Accept the proposal - this merges changes and deletes the source version
	await acceptChangeProposal({
		lix,
		proposal: { id: proposal.id },
	});

	console.log("Proposal accepted and merged");
	console.log("Source version deleted");

	// Verify the proposal status
	const acceptedProposal = await lix.db
		.selectFrom("change_proposal")
		.where("id", "=", proposal.id)
		.selectFirst();

	console.log("Proposal status:", acceptedProposal?.status); // "accepted"

	console.log("SECTION END 'accept-proposal'");

	console.log("SECTION START 'reject-proposal'");

	// Create another proposal to demonstrate rejection
	const featureVersion2 = await lix.db
		.insertInto("version")
		.values({
			name: "feature-experimental",
			parent_version_id: mainVersion.id,
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	const proposal2 = await createChangeProposal({
		lix,
		source: { id: featureVersion2.id },
		target: { id: mainVersion.id },
	});

	// Reject the proposal - marks as rejected, keeps source version
	await rejectChangeProposal({
		lix,
		proposal: { id: proposal2.id },
	});

	console.log("Proposal rejected");

	// Verify the rejection
	const rejectedProposal = await lix.db
		.selectFrom("change_proposal")
		.where("id", "=", proposal2.id)
		.selectFirst();

	console.log("Proposal status:", rejectedProposal?.status); // "rejected"

	// Source version still exists after rejection
	const sourceExists = await lix.db
		.selectFrom("version")
		.where("id", "=", featureVersion2.id)
		.selectFirst();

	console.log("Source version still exists:", !!sourceExists);

	console.log("SECTION END 'reject-proposal'");
}

// Uncomment for running in node
// runExample(console);
