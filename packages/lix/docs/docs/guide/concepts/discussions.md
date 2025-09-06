# Discussions

Discussions in Lix provide a structured way to communicate about changes, proposals, and other aspects of your data. They enable collaboration by allowing team members to comment, provide feedback, and document decisions.

## What are Discussions?

Discussions in Lix consist of:

- **Threads**: Top-level containers for a specific topic or change
- **Comments**: Individual messages within a thread
- **References**: Links to specific changes, files, or other entities
- **Metadata**: Information about authors, timestamps, and context

Discussions are stored in the database and can be associated with change sets, files, or other entities in the system.

## Discussion Schema

The discussion system uses two main tables:

### Thread Table

```typescript
interface Thread {
  id: string;
  title: string;
  description: string;
  created_at: string;
  change_set_id?: string; // Optional reference to a change set
  file_id?: string; // Optional reference to a file
  status?: string; // E.g., "open", "resolved", "closed"
}
```

### Comment Table

```typescript
interface Comment {
  id: string;
  thread_id: string; // Reference to the parent thread
  content: string; // The comment text
  author: string; // Author identifier
  created_at: string; // Timestamp
  reply_to_id?: string; // Optional reference to another comment
}
```

## Creating Discussions

### Creating a Thread

You can create a discussion thread using the database interface:

```typescript
// Create a thread about a change set
const thread = await lix.db
  .insertInto("thread")
  .values({
    id: generateId(),
    title: "Feedback on user authentication flow",
    description: "Please review the new login and registration process.",
    created_at: new Date().toISOString(),
    change_set_id: changeSetId,
  })
  .returningAll()
  .executeTakeFirstOrThrow();

console.log("Created thread:", thread.id);
```

### Adding Comments

You can add comments to a thread:

```typescript
// Add a comment to a thread
const comment = await lix.db
  .insertInto("comment")
  .values({
    id: generateId(),
    thread_id: thread.id,
    content:
      "The login form looks good, but we should add password strength indicators.",
    author: "team.member@example.com",
    created_at: new Date().toISOString(),
  })
  .returningAll()
  .executeTakeFirstOrThrow();

console.log("Added comment:", comment.id);
```

### Reply to a Comment

You can create nested conversations by replying to specific comments:

```typescript
// Reply to a specific comment
const reply = await lix.db
  .insertInto("comment")
  .values({
    id: generateId(),
    thread_id: thread.id,
    content: "Good point. I'll add strength indicators in the next revision.",
    author: "developer@example.com",
    created_at: new Date().toISOString(),
    reply_to_id: comment.id,
  })
  .returningAll()
  .executeTakeFirstOrThrow();
```

## Querying Discussions

### Finding Threads

You can search for threads based on various criteria:

```typescript
// Get all threads related to a specific change set
const threads = await lix.db
  .selectFrom("thread")
  .where("change_set_id", "=", changeSetId)
  .selectAll()
  .execute();

// Get all open threads
const openThreads = await lix.db
  .selectFrom("thread")
  .where("status", "=", "open")
  .selectAll()
  .execute();

// Search threads by title or description
const searchResults = await lix.db
  .selectFrom("thread")
  .where(({ or, cmpr }) =>
    or([
      cmpr("title", "like", `%${searchTerm}%`),
      cmpr("description", "like", `%${searchTerm}%`),
    ]),
  )
  .selectAll()
  .execute();
```

### Retrieving Comments

You can retrieve comments for a specific thread:

```typescript
// Get all comments in a thread, ordered by creation time
const comments = await lix.db
  .selectFrom("comment")
  .where("thread_id", "=", threadId)
  .orderBy("created_at", "asc")
  .selectAll()
  .execute();

// Get comments with author information
const commentsWithAuthors = await lix.db
  .selectFrom("comment")
  .where("thread_id", "=", threadId)
  .select([
    "comment.id",
    "comment.content",
    "comment.created_at",
    "comment.author",
  ])
  .orderBy("comment.created_at", "asc")
  .execute();
```

## Updating Discussions

### Updating Thread Status

You can update the status of a thread to track its progress:

```typescript
// Mark a thread as resolved
await lix.db
  .updateTable("thread")
  .set({
    status: "resolved",
  })
  .where("id", "=", threadId)
  .execute();
```

### Editing Comments

You can edit comments if needed:

```typescript
// Edit a comment
await lix.db
  .updateTable("comment")
  .set({
    content: "Updated comment text with additional information.",
  })
  .where("id", "=", commentId)
  .execute();
```

## Discussion Use Cases

Discussions serve various purposes in Lix:

### Change Reviews

Discussions are essential for reviewing and providing feedback on changes:

```typescript
// Create a review thread for a change set
const reviewThread = await lix.db
  .insertInto("thread")
  .values({
    id: generateId(),
    title: "Review: Add user profile features",
    description: "Please review the new user profile functionality.",
    created_at: new Date().toISOString(),
    change_set_id: changeSetId,
    status: "open",
  })
  .returningAll()
  .executeTakeFirstOrThrow();

// Add review comments
await lix.db
  .insertInto("comment")
  .values({
    id: generateId(),
    thread_id: reviewThread.id,
    content: "The profile image upload feature needs additional validation.",
    author: "reviewer@example.com",
    created_at: new Date().toISOString(),
  })
  .execute();
```

### Documentation

Discussions can be used to document decisions and rationale:

```typescript
// Create a documentation thread
const docThread = await lix.db
  .insertInto("thread")
  .values({
    id: generateId(),
    title: "Database Schema Design Decisions",
    description:
      "Documentation of key decisions regarding our database schema.",
    created_at: new Date().toISOString(),
    status: "documentation",
  })
  .returningAll()
  .executeTakeFirstOrThrow();

// Add documentation comments
await lix.db
  .insertInto("comment")
  .values({
    id: generateId(),
    thread_id: docThread.id,
    content:
      "We chose to use a separate table for user preferences rather than embedding them in the user table to enable better performance for preference queries.",
    author: "architect@example.com",
    created_at: new Date().toISOString(),
  })
  .execute();
```

### Issue Tracking

Discussions can serve as a simple issue tracking system:

```typescript
// Create an issue thread
const issueThread = await lix.db
  .insertInto("thread")
  .values({
    id: generateId(),
    title: "Bug: Login fails on Safari",
    description:
      "Users are reporting login failures specifically on Safari browsers.",
    created_at: new Date().toISOString(),
    status: "open",
  })
  .returningAll()
  .executeTakeFirstOrThrow();

// Add issue details
await lix.db
  .insertInto("comment")
  .values({
    id: generateId(),
    thread_id: issueThread.id,
    content:
      "Reproduces on Safari 16.1. The login form submits but the authentication token isn't being stored correctly.",
    author: "tester@example.com",
    created_at: new Date().toISOString(),
  })
  .execute();
```

## Example: Complete Discussion Workflow

Here's an example of a complete discussion workflow for a change proposal:

```typescript
// Create a feature change set
const featureChangeSet = await createChangeSet({
  lix,
  labels: [
    { key: "type", value: "feature" },
    { key: "proposal", value: "true" },
    { key: "title", value: "Add dark theme support" },
    { key: "status", value: "open" },
  ],
});

// Create a discussion thread for the proposal
const thread = await lix.db
  .insertInto("thread")
  .values({
    id: generateId(),
    title: "Proposal: Add dark theme support",
    description:
      "This change adds a new dark theme option to the application settings.",
    created_at: new Date().toISOString(),
    change_set_id: featureChangeSet.id,
    status: "open",
  })
  .returningAll()
  .executeTakeFirstOrThrow();

// Proposer adds implementation details
await lix.db
  .insertInto("comment")
  .values({
    id: generateId(),
    thread_id: thread.id,
    content:
      "The implementation uses CSS variables to switch between light and dark color schemes. All colors have been adjusted for proper contrast ratios.",
    author: "proposer@example.com",
    created_at: new Date().toISOString(),
  })
  .execute();

// Reviewer asks a question
const questionComment = await lix.db
  .insertInto("comment")
  .values({
    id: generateId(),
    thread_id: thread.id,
    content:
      "Have you tested this with screen readers? We need to ensure accessibility is maintained.",
    author: "reviewer@example.com",
    created_at: new Date().toISOString(),
  })
  .returningAll()
  .executeTakeFirstOrThrow();

// Proposer responds to the question
await lix.db
  .insertInto("comment")
  .values({
    id: generateId(),
    thread_id: thread.id,
    content:
      "Yes, I've tested with VoiceOver and NVDA. All elements maintain their proper roles and labels regardless of theme.",
    author: "proposer@example.com",
    created_at: new Date().toISOString(),
    reply_to_id: questionComment.id,
  })
  .execute();

// Reviewer provides feedback
await lix.db
  .insertInto("comment")
  .values({
    id: generateId(),
    thread_id: thread.id,
    content:
      "The contrast ratio in the notification component is too low. Please increase it to meet WCAG AA standards.",
    author: "reviewer@example.com",
    created_at: new Date().toISOString(),
  })
  .execute();

// Proposer acknowledges the feedback
await lix.db
  .insertInto("comment")
  .values({
    id: generateId(),
    thread_id: thread.id,
    content:
      "Good catch. I'll fix the notification component contrast in the next revision.",
    author: "proposer@example.com",
    created_at: new Date().toISOString(),
  })
  .execute();

// After making changes, proposer updates the thread
await lix.db
  .insertInto("comment")
  .values({
    id: generateId(),
    thread_id: thread.id,
    content:
      "I've updated the notification component colors to increase the contrast ratio. Now all components meet WCAG AA standards.",
    author: "proposer@example.com",
    created_at: new Date().toISOString(),
  })
  .execute();

// Reviewer approves
await lix.db
  .insertInto("comment")
  .values({
    id: generateId(),
    thread_id: thread.id,
    content: "The changes look good. I approve this proposal.",
    author: "reviewer@example.com",
    created_at: new Date().toISOString(),
  })
  .execute();

// Update thread status
await lix.db
  .updateTable("thread")
  .set({
    status: "approved",
  })
  .where("id", "=", thread.id)
  .execute();

// After merging, add a final comment
await lix.db
  .insertInto("comment")
  .values({
    id: generateId(),
    thread_id: thread.id,
    content: "This proposal has been merged into the main version.",
    author: "system",
    created_at: new Date().toISOString(),
  })
  .execute();

// Close the thread
await lix.db
  .updateTable("thread")
  .set({
    status: "closed",
  })
  .where("id", "=", thread.id)
  .execute();
```

## Next Steps

Now that you understand discussions in Lix, explore these related concepts:

- [Change Proposals](./change-proposals) - How discussions facilitate the proposal process
- [Change Sets](./change-sets) - The entities discussions often reference
- [Labels](./labels) - How to categorize and organize threads
- [Versions](./versions) - How discussions relate to different versions
