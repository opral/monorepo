# Lix for AI Agents

![AI agent changes need to be visible and controllable](/blame-what-did-you-change.svg)

AI agents are powerful but imperfect—they hallucinate, generate incorrect data, and break things outright. Without lix change control, there is no visibility, accountability, or control over AI agents.

### See Every Change

[Attribution](./attribution.md) shows exactly what changes an AI agent made.

### Accept or Reject

Review AI-generated changes through [change proposals](./change-proposals.md). Accept good modifications, reject hallucinations, and let users modify anything that needs adjustment.

### Validation Rules as Guardrails and Self-Correction

[Validation rules](./validation-rules.md) automatically check AI-generated changes for quality issues and data format violations. AI agents can use validation results to self-correct their mistakes, improving output quality without human intervention.

![Validation rules for AI agents](/validation-rules-agent.svg)

### Versions for Experimentation

Create isolated [versions](./versions.mdx) (branches) where AI agents can experiment safely without affecting the main data. Test AI-generated changes in these sandboxed environments before merging them back.

Made a mistake accepting AI changes? [Restore](./restore.mdx) to any previous state.
