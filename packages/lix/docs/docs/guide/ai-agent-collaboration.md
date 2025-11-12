# Lix for AI Agents

![AI agent changes need to be visible and controllable](/blame-what-did-you-change.svg)

AI agents generate a tremendous volume of changes. These changes need to be reviewed, attributed, and approved; Lix change control provides the safety layer so every edit is traceable, humans decide what ships, and any change can be rolled back.

## Every change is reviewable

- Use [attribution](./attribution.md) to see exactly which agent (or human) changed a field, paragraph, or table cell.
- Compare versions with entity-aware [diffs](./diffs.mdx) so reviewers understand the intent of a change instead of guessing from raw text.
- Keep a durable audit trail; you can query history for “Which agent touched this configuration last?” at any time.

## Users stay in control

Agents can draft changes, but humans stay in the loop with lightweight review tools.

- [Change proposals](./change-proposals.md) bundle the diff, discussion, and approval state. Accept the good ideas, reject the hallucinations.
- Start review conversations with stakeholders or other agents using comments and mentions from [conversations](./conversations.md).
- Merge once the proposal is ready, or request another revision—the entire workflow maps to familiar pull-request style collaboration.

## Safe sandboxes for agents

[Versions](./versions.mdx) let you spin up isolated environments so agents can explore ideas without touching production data.

- Run multiple agents in parallel, each in their own version.
- Compare their diffs, merge the best outcome, or discard a version entirely.
- If something slips through, use [restore](./restore.mdx) to jump back to a known-good state in seconds.

## Typical workflow

1. Orchestration layer opens a fresh version for an agent task.
2. Agent writes changes; Lix auto-commits and tracks attribution.
3. Another agent or a human reviewer inspects the diff and opens a change proposal.
4. Reviewers comment, request edits, and approve when ready.
5. Merge the proposal or discard it; restore any previous snapshot if plans change.

## Coming soon: automated guardrails

> [!NOTE]
> [Validation rules](./validation-rules.md) are an upcoming feature. They will let you define automated checks that agents can use to self-correct before a human ever sees the proposal. Follow the issue for progress and demos.

![Validation rules for AI agents](/validation-rules-agent.svg)

## Next steps

- Walk through the [Getting Started guide](./getting-started.mdx) to wire Lix into your agent pipeline.
- Learn how to diff, merge, and experiment with [versions](./versions.mdx).
- See change proposals in action in the [live example](https://prosemirror-example.onrender.com/).
