# Validation Rules

> [!NOTE]
>
> Validation rules are a proposed feature. If you're interested in using validation rules:
>
> - **Upvote the proposal:** [github.com/opral/lix-sdk/issues/239](https://github.com/opral/lix-sdk/issues/239)
> - **Watch the demo:** See validation rules in action in the [issue's demo video](https://github.com/opral/lix-sdk/issues/239)

Validation rules automatically catch mistakes—enabling agents and humans to self-fix issues.

Every change by an agent or a human is checked for mistakes. Agents can learn from these checks and fix issues on their own, while humans get immediate feedback and fewer review cycles. The result: higher quality, faster releases, and less manual oversight.

Below is an example of how validation rules surface issues and offer instant fixes—whether the change comes from an agent or a human:

![Validation Rules](/validation-rules.svg)

## Use Cases

### Self-Correcting AI Agents

Validation rules enable agents to detect and fix their own mistakes.

For example, if an agent enters incorrect date format into a spreadsheet, a validation rule reports the mistake and the agent can then correct the error and re-check, without a human in the loop.

This is similar to how code linting works in editors like Cursor: errors are flagged, and the agent (or developer) can fix them right away. The process is fast, automatic, and keeps your data clean.

![Validation Rules for AI Agents](/validation-rules-agent.svg)

### Cross Team Collaboration

Validation rules let teams catch and resolve issues—like missing information or incomplete tasks—without having to coordinate directly.

Everyone can see what needs attention in real time as work moves through the pipeline. This is especially useful in workflows where different roles contribute at different stages but may not communicate with each other. For example, in localization, auditors, translators, and designers can all stay aligned automatically without direct handoffs. The result: nothing gets missed, and everyone stays on track.

![Cross Team Collaboration via Validation Rules](/validation-rules-cross-team.png)
