import { openLix, createChangeProposal } from "@lix-js/sdk";

async function demonstrateCreateChangeProposal() {
  const lix = await openLix({});

  const activeVersion = await lix.db.selectFrom("active_version")
    .innerJoin("version", "active_version.version_id", "version.id")
    .select("version.id")
    .executeTakeFirstOrThrow();

  const mainVersion = await lix.db.selectFrom("version")
    .where("name", "=", "main")
    .select("id")
    .executeTakeFirstOrThrow();

  // Create a change proposal (like a pull request)
  const proposal = await createChangeProposal({
    lix,
    title: "Fix typos in documentation",
    description: "This proposal fixes several spelling errors",
    sourceVersion: activeVersion,
    targetVersion: mainVersion
  });

  console.log("Change proposal created:", proposal);
}

// Run the demonstration
demonstrateCreateChangeProposal().catch(console.error);