import { openLix } from "@lix-js/sdk";

// Note: These functions may not be available in the current SDK version
// but are shown here for demonstration purposes based on the documentation
async function createChangeProposal(options: any) {
  // Placeholder implementation
  console.log("Creating change proposal:", options.title);
  return { id: "proposal-123", ...options };
}

async function acceptChangeProposal(options: any) {
  console.log("Accepting proposal:", options.proposal.id);
}

async function rejectChangeProposal(options: any) {
  console.log(
    "Rejecting proposal:",
    options.proposal.id,
    "with comment:",
    options.comment,
  );
}

export default async function runExample(console: any) {
  const lix = await openLix({});

  console.log("SECTION START 'create-proposal'");
  const activeVersion = await lix.db
    .selectFrom("active_version")
    .innerJoin("version", "active_version.version_id", "version.id")
    .select("version.id")
    .executeTakeFirstOrThrow();

  const mainVersion = await lix.db
    .selectFrom("version")
    .where("name", "=", "main")
    .select("id")
    .executeTakeFirstOrThrow();

  // Create a change proposal (like a pull request)
  const proposal = await createChangeProposal({
    lix,
    title: "Fix typos in documentation",
    description: "This proposal fixes several spelling errors",
    sourceVersion: activeVersion,
    targetVersion: mainVersion,
  });

  console.log("Change proposal created:", proposal.title);

  console.log("SECTION END 'create-proposal'");

  console.log("SECTION START 'handle-proposal'");
  // Merge the proposal (accepts and merges in one action)
  await acceptChangeProposal({
    lix,
    proposal: proposal,
  });

  console.log("Proposal accepted and merged");

  // Or reject the proposal
  await rejectChangeProposal({
    lix,
    proposal: proposal,
    comment: "Needs more work on error handling",
  });

  console.log("Proposal rejected with feedback");

  console.log("SECTION END 'handle-proposal'");
}

// Uncomment for running in node
// runExample(console);
