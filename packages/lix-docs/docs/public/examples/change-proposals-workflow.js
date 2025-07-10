import { openLix, createChangeProposal, acceptChangeProposal, rejectChangeProposal } from "@lix-js/sdk";

async function demonstrateChangeProposalWorkflow() {
  const lix = await openLix({});

  // First create a proposal
  const activeVersion = await lix.db.selectFrom("active_version")
    .innerJoin("version", "active_version.version_id", "version.id")
    .select("version.id")
    .executeTakeFirstOrThrow();

  const mainVersion = await lix.db.selectFrom("version")
    .where("name", "=", "main")
    .select("id")
    .executeTakeFirstOrThrow();

  const proposal = await createChangeProposal({
    lix,
    title: "Fix typos in documentation",
    description: "This proposal fixes several spelling errors",
    sourceVersion: activeVersion,
    targetVersion: mainVersion
  });

  console.log("Change proposal created:", proposal);

  // Example of accepting a proposal
  try {
    await acceptChangeProposal({
      lix,
      proposal: proposal
    });
    console.log("Proposal accepted and merged successfully");
  } catch (error) {
    console.log("Accept failed, trying reject instead");
    
    // Or reject the proposal
    await rejectChangeProposal({
      lix,
      proposal: proposal,
      comment: "Needs more work on error handling"
    });
    console.log("Proposal rejected with comment");
  }
}

// Run the demonstration
demonstrateChangeProposalWorkflow().catch(console.error);