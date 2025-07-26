# Validation Rules

Validation rules automatically catch mistakes—enabling agents and humans to self-fix issues.

Every change by an agent or a human is checked for mistakes. Agents can learn from these checks and fix issues on their own, while humans get immediate feedback and fewer review cycles. The result: higher quality, faster releases, and less manual oversight.

Below is an example of how validation rules surface issues and offer instant fixes—whether the change comes from an agent or a human:

![Validation Rules](/validation-rules.svg)

After a fix, agents (or humans) can see validation results update in real time, similar to how code linting works in development:

![Validation Rules for AI Agents](/validation-rules-agent.svg)

> [!NOTE]
> Validation rules are a proposed feature. If you're interested in using validation rules:
>
> - **Upvote the proposal:** [github.com/opral/lix-sdk/issues/239](https://github.com/opral/lix-sdk/issues/239)
> - **Watch the demo:** See validation rules in action in the [issue's demo video](https://github.com/opral/lix-sdk/issues/239)

## Use Cases

- **Localization:** Ensure all messages are translated to required languages
- **Data formats:** Validate dates conform to ISO 8601 in spreadsheets
- **AI agent self-correction:** Enable agents to detect and fix their own mistakes
