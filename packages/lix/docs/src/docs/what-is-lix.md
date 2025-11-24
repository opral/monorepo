# What is Lix?

Lix is a change control system that enables Git-like features for applications and AI agents such as [Change Proposals](/docs/change-proposals), [Versions](/docs/versions) (branching), [History](/docs/history), and [Blame](/docs/attribution).

What makes lix unique:

- 🌐 Embeddable - Works is in the Browser, Node.js, etc.
- 📄 Supports any data format (Excel, JSON, CSV, etc.)
- 🛠️ SDK-first - Designed for applications

## Use Cases

- AI agent safety rails: agents propose edits instead of applying directly; humans review diffs and restore if needed.
- Collaborative editing in apps: multi-user workflows with change proposals, conversations, and history/blame for structured data.
- Approval workflows: branch/merge-style reviews for non-code data before changes go live.
- Auditable data changes: track who changed what and when with versioned history and diff views.
- Product experiments and variants: spin up versions of data models or content, compare diffs, and merge back selectively.

![Lix features](/lix-features.svg)
