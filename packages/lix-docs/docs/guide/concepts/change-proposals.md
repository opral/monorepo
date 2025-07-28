# Change Proposals

Change proposals in Lix provide a formalized mechanism for suggesting, reviewing, and integrating changes. They are essential for collaborative workflows, enabling team members to propose modifications and receive feedback before changes are merged.

## What are Change Proposals?

A change proposal is:

- A collection of changes packaged as a potential modification
- A reviewable unit of work with a clear intent
- A mechanism for feedback and approval
- Similar to pull requests in Git, but with finer granularity

Change proposals allow teams to implement quality control processes and ensure that changes are properly reviewed before being integrated into the main version.

## Components of a Change Proposal

A change proposal typically consists of:

1. **Source Change Set**: The change set containing the proposed changes
2. **Target Version**: The version the changes would be merged into
3. **Metadata**: Title, description, status, and other contextual information
4. **Discussions**: Comments and feedback related to the proposal
5. **Review Status**: Approval state and reviewer information

## Creating Change Proposals

Change proposals are created using a combination of Lix's core functionality:

```typescript
// First, make changes in a feature branch
const featureChangeSet = await createChangeSet({
  lix,
  labels: [
    { key: "type", value: "feature" },
    { key: "proposal", value: "true" },
    { key: "title", value: "Add dark theme support" },
    { key: "status", value: "open" },
  ],
});

// Add a thread for discussion
const thread = await lix.db
  .insertInto("thread")
  .values({
    id: generateId(),
    title: "Add dark theme support",
    description:
      "This change adds a new dark theme option to the application settings.",
    created_at: new Date().toISOString(),
    change_set_id: featureChangeSet.id,
  })
  .returningAll()
  .executeTakeFirstOrThrow();

// Link the proposal to a target version
await lix.db
  .insertInto("proposal_target")
  .values({
    id: generateId(),
    proposal_change_set_id: featureChangeSet.id,
    target_version_id: mainVersionId,
    created_at: new Date().toISOString(),
  })
  .execute();
```

## Reviewing Change Proposals

The review process involves:

1. **Examining Changes**: Reviewers inspect the proposed changes
2. **Providing Feedback**: Comments and suggestions are added to the discussion
3. **Requesting Revisions**: If needed, the proposer makes additional changes
4. **Approving or Rejecting**: The proposal is either accepted or declined

Here's how to implement the review process:

```typescript
// Add a comment to the proposal thread
await lix.db
  .insertInto("comment")
  .values({
    id: generateId(),
    thread_id: thread.id,
    content:
      "The dark theme looks good, but we should adjust the contrast ratio for better accessibility.",
    author: "reviewer@example.com",
    created_at: new Date().toISOString(),
  })
  .execute();

// Update the proposal status
await lix.db
  .updateTable("change_set_label")
  .set({
    value: "needs-revision",
  })
  .where("entity_id", "=", featureChangeSet.id)
  .where("key", "=", "status")
  .execute();

// After revisions, add approval
await lix.db
  .insertInto("change_set_label")
  .values({
    id: generateId(),
    entity_id: featureChangeSet.id,
    key: "approved-by",
    value: "reviewer@example.com",
    created_at: new Date().toISOString(),
  })
  .execute();

// Update status to approved
await lix.db
  .updateTable("change_set_label")
  .set({
    value: "approved",
  })
  .where("entity_id", "=", featureChangeSet.id)
  .where("key", "=", "status")
  .execute();
```

## Merging Approved Proposals

Once a proposal is approved, it can be merged into the target version:

```typescript
// Get the proposal change set
const proposalChangeSet = await lix.db
  .selectFrom("change_set")
  .innerJoin("change_set_label as proposal_label", (join) => {
    return join
      .onRef("proposal_label.entity_id", "=", "change_set.id")
      .on("proposal_label.key", "=", sql`'proposal'`)
      .on("proposal_label.value", "=", sql`'true'`);
  })
  .innerJoin("change_set_label as status_label", (join) => {
    return join
      .onRef("status_label.entity_id", "=", "change_set.id")
      .on("status_label.key", "=", sql`'status'`)
      .on("status_label.value", "=", sql`'approved'`);
  })
  .where("change_set.id", "=", proposalId)
  .selectAll("change_set")
  .executeTakeFirstOrThrow();

// Get the target version
const targetVersion = await lix.db
  .selectFrom("version")
  .innerJoin(
    "proposal_target",
    "proposal_target.target_version_id",
    "version.id",
  )
  .where("proposal_target.proposal_change_set_id", "=", proposalChangeSet.id)
  .selectAll("version")
  .executeTakeFirstOrThrow();

// Create a merge change set
const mergeChangeSet = await createMergeChangeSet({
  lix,
  sources: [{ id: targetVersion.change_set_id }, { id: proposalChangeSet.id }],
});

// Update the target version to point to the merge change set
await lix.db
  .updateTable("version")
  .set({
    change_set_id: mergeChangeSet.id,
  })
  .where("id", "=", targetVersion.id)
  .execute();

// Update the proposal status
await lix.db
  .updateTable("change_set_label")
  .set({
    value: "merged",
  })
  .where("entity_id", "=", proposalChangeSet.id)
  .where("key", "=", "status")
  .execute();

// Add a merge comment to the thread
await lix.db
  .insertInto("comment")
  .values({
    id: generateId(),
    thread_id: thread.id,
    content: `Merged into ${targetVersion.name} as change set ${mergeChangeSet.id}`,
    author: "system",
    created_at: new Date().toISOString(),
  })
  .execute();
```

## Change Proposal Workflow

A typical change proposal workflow includes these steps:

1. **Create a Feature Branch**: Start with a new version branched from the target
2. **Make Changes**: Implement the desired modifications
3. **Create a Proposal**: Package the changes as a formal proposal
4. **Review Process**: Gather feedback and make revisions
5. **Approval**: Get signoff from reviewers
6. **Merge**: Integrate the approved changes into the target version

## Example: Complete Change Proposal Flow

Here's a comprehensive example of a change proposal workflow:

```typescript
// Start with the main version
const mainVersion = await lix.db
  .selectFrom("version")
  .where("name", "=", "main")
  .selectAll()
  .executeTakeFirstOrThrow();

// Create a feature branch
const featureVersion = await createVersion({
  lix,
  name: "feature/dark-theme",
  changeSet: { id: mainVersion.change_set_id },
  inherits_from_version_id: mainVersion.id,
});

// Switch to the feature branch
await switchVersion({
  lix,
  to: featureVersion.id,
});

// Make changes in the feature branch
await handleFileUpdate({
  lix,
  file: {
    path: "/config.json",
    data: new TextEncoder().encode(
      JSON.stringify({
        theme: "dark",
        // other settings...
      }),
    ),
  },
});

// Create a change set for the feature
const featureChangeSet = await createChangeSet({
  lix,
  labels: [
    { key: "type", value: "feature" },
    { key: "proposal", value: "true" },
    { key: "title", value: "Add dark theme support" },
    {
      key: "description",
      value: "This change adds dark theme support with proper contrast ratios.",
    },
    { key: "status", value: "open" },
  ],
});

// Update the feature version to point to the new change set
await lix.db
  .updateTable("version")
  .set({
    change_set_id: featureChangeSet.id,
  })
  .where("id", "=", featureVersion.id)
  .execute();

// Create a discussion thread
const thread = await lix.db
  .insertInto("thread")
  .values({
    id: generateId(),
    title: "Add dark theme support",
    description:
      "This change adds a new dark theme option to the application settings.",
    created_at: new Date().toISOString(),
    change_set_id: featureChangeSet.id,
  })
  .returningAll()
  .executeTakeFirstOrThrow();

// Add the proposal target
await lix.db
  .insertInto("proposal_target")
  .values({
    id: generateId(),
    proposal_change_set_id: featureChangeSet.id,
    target_version_id: mainVersion.id,
    created_at: new Date().toISOString(),
  })
  .execute();

// Reviewer adds a comment
await lix.db
  .insertInto("comment")
  .values({
    id: generateId(),
    thread_id: thread.id,
    content: "Please adjust the contrast of the secondary colors.",
    author: "reviewer@example.com",
    created_at: new Date().toISOString(),
  })
  .execute();

// Proposer makes the requested changes
await handleFileUpdate({
  lix,
  file: {
    path: "/config.json",
    data: new TextEncoder().encode(
      JSON.stringify({
        theme: "dark",
        contrast: "high",
        // other settings...
      }),
    ),
  },
});

// Create a new change set for the revision
const revisionChangeSet = await createChangeSet({
  lix,
  parents: [{ id: featureChangeSet.id }],
  labels: [
    { key: "type", value: "revision" },
    { key: "proposal", value: "true" },
    { key: "title", value: "Add dark theme support" },
    {
      key: "description",
      value: "Updated with higher contrast ratios per review feedback.",
    },
    { key: "status", value: "in-review" },
  ],
});

// Update the feature version to point to the revised change set
await lix.db
  .updateTable("version")
  .set({
    change_set_id: revisionChangeSet.id,
  })
  .where("id", "=", featureVersion.id)
  .execute();

// Proposer adds a comment about the changes
await lix.db
  .insertInto("comment")
  .values({
    id: generateId(),
    thread_id: thread.id,
    content:
      "I've increased the contrast ratio as requested. The theme now passes WCAG AA standards.",
    author: "proposer@example.com",
    created_at: new Date().toISOString(),
  })
  .execute();

// Reviewer approves
await lix.db
  .insertInto("change_set_label")
  .values({
    id: generateId(),
    entity_id: revisionChangeSet.id,
    key: "approved-by",
    value: "reviewer@example.com",
    created_at: new Date().toISOString(),
  })
  .execute();

// Update status to approved
await lix.db
  .updateTable("change_set_label")
  .set({
    value: "approved",
  })
  .where("entity_id", "=", revisionChangeSet.id)
  .where("key", "=", "status")
  .execute();

// Create a merge change set
const mergeChangeSet = await createMergeChangeSet({
  lix,
  sources: [{ id: mainVersion.change_set_id }, { id: revisionChangeSet.id }],
});

// Update the main version to point to the merge change set
await lix.db
  .updateTable("version")
  .set({
    change_set_id: mergeChangeSet.id,
  })
  .where("id", "=", mainVersion.id)
  .execute();

// Update the proposal status
await lix.db
  .updateTable("change_set_label")
  .set({
    value: "merged",
  })
  .where("entity_id", "=", revisionChangeSet.id)
  .where("key", "=", "status")
  .execute();

// Add a merge notification
await lix.db
  .insertInto("comment")
  .values({
    id: generateId(),
    thread_id: thread.id,
    content: `Changes have been merged into the main version.`,
    author: "system",
    created_at: new Date().toISOString(),
  })
  .execute();
```

## Next Steps

Now that you understand change proposals in Lix, explore these related concepts:

- [Merging](./merging) - How changes are combined across branches
- [Versions](./versions) - How named branches are managed
- [Change Sets](./change-sets) - The building blocks of proposals
- [Discussions](./discussions) - How feedback is provided on proposals
