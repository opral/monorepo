export default async function runExample(console: any) {
  const {
    openLix,
    createVersion,
    switchVersion,
    createChangeProposal,
    acceptChangeProposal,
    rejectChangeProposal,
  } = await import("@lix-js/sdk");

  // Optional: load JSON plugin so you can make structured edits before proposing
  const { plugin: jsonPlugin } = await import("@lix-js/plugin-json");

  const lix = await openLix({
    providePlugins: [jsonPlugin],
  });

  console.log("SECTION START 'create-proposal'");

  // Get the main version
  const mainVersion = await lix.db
    .selectFrom("version")
    .where("name", "=", "main")
    .select(["id"])
    .executeTakeFirstOrThrow();

  // Create a feature version for proposed changes (inherits from main)
  const featureVersion = await createVersion({
    lix,
    name: "feature-typo-fixes",
    inheritsFrom: mainVersion,
  });

  // Switch to the feature version and make edits before proposing
  await switchVersion({ lix, to: featureVersion });
  // ...perform edits here (e.g., update files/entities)...

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

  // Switch back to main before accepting (so deleting the source version is safe)
  await switchVersion({ lix, to: mainVersion });

  // Accept the proposal - this merges changes and deletes the source version
  await acceptChangeProposal({
    lix,
    proposal: { id: proposal.id },
  });

  console.log("Proposal accepted and merged");

  // Verify the source version was deleted after acceptance
  const acceptedSource = await lix.db
    .selectFrom("version")
    .where("id", "=", featureVersion.id)
    .selectAll()
    .executeTakeFirst();

  console.log("Source version deleted:", !acceptedSource);

  console.log("SECTION END 'accept-proposal'");

  console.log("SECTION START 'reject-proposal'");

  // Create another proposal to demonstrate rejection
  const featureVersion2 = await createVersion({
    lix,
    name: "feature-experimental",
    inheritsFrom: mainVersion,
  });

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
    .selectAll()
    .executeTakeFirst();

  console.log("Proposal status:", rejectedProposal?.status); // "rejected"

  // Source version still exists after rejection
  const sourceExists = await lix.db
    .selectFrom("version")
    .where("id", "=", featureVersion2.id)
    .selectAll()
    .executeTakeFirst();

  console.log("Source version still exists:", !!sourceExists);

  console.log("SECTION END 'reject-proposal'");
}

// Uncomment for running in node
// runExample(console);

