# TypeScript

> Build custom AI agents with the Claude Code TypeScript SDK

## Prerequisites

* Node.js 18+

## Installation

Install `@anthropic-ai/claude-code` from NPM:

```bash
npm install -g @anthropic-ai/claude-code
```

<Note>
  To view the TypeScript SDK source code, visit the [`@anthropic-ai/claude-code` page on NPM](https://www.npmjs.com/package/@anthropic-ai/claude-code?activeTab=code).
</Note>

## Basic usage

The primary interface via the TypeScript SDK is the `query` function, which returns an async iterator that streams messages as they arrive:

```ts
import { query } from "@anthropic-ai/claude-code";

for await (const message of query({
  prompt: "Analyze system performance",
  options: {
    maxTurns: 5,
    appendSystemPrompt: "You are a performance engineer",
    allowedTools: ["Bash", "Read", "WebSearch"],
    abortController: new AbortController(),
  }
})) {
  if (message.type === "result" && message.subtype === "success") {
    console.log(message.result);
  }
}
```

## Configuration options

| Argument                     | Type                                                              | Description                                      | Default                                                                              |
| :--------------------------- | :---------------------------------------------------------------- | :----------------------------------------------- | :----------------------------------------------------------------------------------- |
| `abortController`            | `AbortController`                                                 | Abort controller for cancelling operations       | `new AbortController()`                                                              |
| `additionalDirectories`      | `string[]`                                                        | Additional directories to include in the session | `undefined`                                                                          |
| `allowedTools`               | `string[]`                                                        | List of tools that Claude is allowed to use      | All tools enabled by default                                                         |
| `appendSystemPrompt`         | `string`                                                          | Text to append to the default system prompt      | `undefined`                                                                          |
| `canUseTool`                 | `(toolName: string, input: any) => Promise<ToolPermissionResult>` | Custom permission function for tool usage        | `undefined`                                                                          |
| `continue`                   | `boolean`                                                         | Continue the most recent session                 | `false`                                                                              |
| `customSystemPrompt`         | `string`                                                          | Replace the default system prompt entirely       | `undefined`                                                                          |
| `cwd`                        | `string`                                                          | Current working directory                        | `process.cwd()`                                                                      |
| `disallowedTools`            | `string[]`                                                        | List of tools that Claude is not allowed to use  | `undefined`                                                                          |
| `env`                        | `Dict<string>`                                                    | Environment variables to set                     | `undefined`                                                                          |
| `executable`                 | `'bun' \| 'deno' \| 'node'`                                       | Which JavaScript runtime to use                  | `node` when running with Node.js, `bun` when running with Bun                        |
| `executableArgs`             | `string[]`                                                        | Arguments to pass to the executable              | `[]`                                                                                 |
| `fallbackModel`              | `string`                                                          | Model to use if primary model fails              | `undefined`                                                                          |
| `hooks`                      | `Partial<Record<HookEvent, HookCallbackMatcher[]>>`               | Lifecycle hooks for customization                | `undefined`                                                                          |
| `maxThinkingTokens`          | `number`                                                          | Maximum tokens for Claude's thinking process     | `undefined`                                                                          |
| `maxTurns`                   | `number`                                                          | Maximum number of conversation turns             | `undefined`                                                                          |
| `mcpServers`                 | `Record<string, McpServerConfig>`                                 | MCP server configurations                        | `undefined`                                                                          |
| `model`                      | `string`                                                          | Claude model to use                              | Uses default from CLI configuration                                                  |
| `pathToClaudeCodeExecutable` | `string`                                                          | Path to the Claude Code executable               | Executable that ships with `@anthropic-ai/claude-code`                               |
| `permissionMode`             | `PermissionMode`                                                  | Permission mode for the session                  | `"default"` (options: `"default"`, `"acceptEdits"`, `"bypassPermissions"`, `"plan"`) |
| `resume`                     | `string`                                                          | Session ID to resume                             | `undefined`                                                                          |
| `stderr`                     | `(data: string) => void`                                          | Callback for stderr output                       | `undefined`                                                                          |
| `strictMcpConfig`            | `boolean`                                                         | Enforce strict MCP configuration validation      | `undefined`                                                                          |

## Multi-turn conversations

For multi-turn conversations, you have two options.

You can generate responses and resume them, or you can use streaming input mode which accepts an async/generator for an array of messages. For now, streaming input mode is the only way to attach images via messages.

### Resume with session management

```ts
import { query } from "@anthropic-ai/claude-code";

// Continue most recent conversation
for await (const message of query({
  prompt: "Now refactor this for better performance",
  options: { continue: true }
})) { 
  if (message.type === "result" && message.subtype === "success") console.log(message.result);
}

// Resume specific session
for await (const message of query({
  prompt: "Update the tests",
  options: {
    resume: "550e8400-e29b-41d4-a716-446655440000",
    maxTurns: 3
  }
})) {
  if (message.type === "result" && message.subtype === "success") console.log(message.result);
}
```

## Streaming input mode

Streaming input mode allows you to provide messages as an async iterable instead of a single string. This enables multi-turn conversations, image attachments, and dynamic message generation:

```ts
import { query } from "@anthropic-ai/claude-code";

// Create an async generator for streaming messages
async function* generateMessages() {
  yield {
    type: "user" as const,
    message: {
      role: "user" as const,
      content: "Start analyzing this codebase"
    }
  };
  
  // Wait for some condition or user input
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  yield {
    type: "user" as const,
    message: {
      role: "user" as const,
      content: "Now focus on the authentication module"
    }
  };
}

// Use streaming input
for await (const message of query({
  prompt: generateMessages(),
  options: {
    maxTurns: 5,
    allowedTools: ["Read", "Grep", "Bash"]
  }
})) {
  if (message.type === "result" && message.subtype === "success") {
    console.log(message.result);
  }
}
```

### Streaming input with images

Streaming input mode is the only way to attach images via messages:

```ts
import { query } from "@anthropic-ai/claude-code";
import { readFileSync } from "fs";

async function* messagesWithImage() {
  // Send an image with text
  yield {
    type: "user" as const,
    message: {
      role: "user" as const,
      content: [
        {
          type: "text",
          text: "Analyze this screenshot and suggest improvements"
        },
        {
          type: "image",
          source: {
            type: "base64",
            media_type: "image/png",
            data: readFileSync("screenshot.png", "base64")
          }
        }
      ]
    }
  };
}

for await (const message of query({
  prompt: messagesWithImage()
})) {
  if (message.type === "result" && message.subtype === "success") console.log(message.result);
}
```

## Custom system prompts

System prompts define your agent's role, expertise, and behavior:

```ts
import { query } from "@anthropic-ai/claude-code";

// SRE incident response agent
for await (const message of query({
  prompt: "API is down, investigate",
  options: {
    customSystemPrompt: "You are an SRE expert. Diagnose issues systematically and provide actionable solutions.",
    maxTurns: 3
  }
})) {
  if (message.type === "result" && message.subtype === "success") console.log(message.result);
}

// Append to default system prompt
for await (const message of query({
  prompt: "Refactor this function",
  options: {
    appendSystemPrompt: "Always include comprehensive error handling and unit tests.",
    maxTurns: 2
  }
})) {
  if (message.type === "result" && message.subtype === "success") console.log(message.result);
}
```

## MCP Server Integration

The Model Context Protocol (MCP) lets you give your agents custom tools and capabilities:

```ts
import { query } from "@anthropic-ai/claude-code";

// SRE agent with monitoring tools
for await (const message of query({
  prompt: "Investigate the payment service outage",
  options: {
    mcpConfig: "sre-tools.json",
    allowedTools: ["mcp__datadog", "mcp__pagerduty", "mcp__kubernetes"],
    appendSystemPrompt: "You are an SRE. Use monitoring data to diagnose issues.",
    maxTurns: 4
  }
})) {
  if (message.type === "result" && message.subtype === "success") console.log(message.result);
}
```

## Custom tools with in-process MCP servers

SDK MCP servers allow you to create custom tools that run directly in your application process, providing type-safe tool execution without the overhead of separate processes or network communication.

### Creating custom tools

Use the `createSdkMcpServer` and `tool` helper functions to define type-safe custom tools:

```ts
import { query, tool, createSdkMcpServer } from "@anthropic-ai/claude-code";
import { z } from "zod";

// Create an SDK MCP server with custom tools
const customServer = createSdkMcpServer({
  name: "my-custom-tools",
  version: "1.0.0",
  tools: [
    tool(
      "calculate_compound_interest",
      "Calculate compound interest for an investment",
      {
        principal: z.number().describe("Initial investment amount"),
        rate: z.number().describe("Annual interest rate (as decimal, e.g., 0.05 for 5%)"),
        time: z.number().describe("Investment period in years"),
        n: z.number().default(12).describe("Compounding frequency per year")
      },
      async (args) => {
        const amount = args.principal * Math.pow(1 + args.rate / args.n, args.n * args.time);
        const interest = amount - args.principal;
        
        return {
          content: [{
            type: "text",
            text: `Final amount: $${amount.toFixed(2)}\nInterest earned: $${interest.toFixed(2)}`
          }]
        };
      }
    ),
    tool(
      "fetch_user_data",
      "Fetch user data from your application database",
      {
        userId: z.string().describe("The user ID to fetch"),
        fields: z.array(z.string()).optional().describe("Specific fields to return")
      },
      async (args) => {
        // Direct access to your application's data layer
        const userData = await myDatabase.getUser(args.userId, args.fields);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(userData, null, 2)
          }]
        };
      }
    )
  ]
});

// Use the custom tools in your query
for await (const message of query({
  prompt: "Calculate compound interest for $10,000 at 5% for 10 years",
  options: {
    mcpServers: {
      "my-custom-tools": customServer
    },
    maxTurns: 3
  }
})) {
  if (message.type === "result") {
    console.log(message.result);
  }
}
```

### Type safety with Zod

The `tool` helper provides full TypeScript type inference from your Zod schemas:

```ts
tool(
  "process_data",
  "Process structured data with type safety",
  {
    // Zod schema defines both runtime validation and TypeScript types
    data: z.object({
      name: z.string(),
      age: z.number().min(0).max(150),
      email: z.string().email(),
      preferences: z.array(z.string()).optional()
    }),
    format: z.enum(["json", "csv", "xml"]).default("json")
  },
  async (args) => {
    // args is fully typed based on the schema
    // TypeScript knows: args.data.name is string, args.data.age is number, etc.
    console.log(`Processing ${args.data.name}'s data as ${args.format}`);
    
    // Your processing logic here
    return {
      content: [{
        type: "text",
        text: `Processed data for ${args.data.name}`
      }]
    };
  }
)
```

## Hooks

Hooks allow you to customize and extend Claude Code's behavior by running custom callbacks at various points in the agent's lifecycle. Unlike CLI hooks that execute bash commands, SDK hooks are JavaScript/TypeScript functions that run in-process.

### Defining hooks

Hooks are organized by event type, with optional matchers to filter when they run:

```ts
import { query } from "@anthropic-ai/claude-code";

for await (const message of query({
  prompt: "Analyze the codebase",
  options: {
    hooks: {
      PreToolUse: [
        {
          matcher: "Write",
          hooks: [
            async (input, toolUseId, { signal }) => {
              console.log(`About to write file: ${input.tool_input.file_path}`);
              
              // Validate the operation
              if (input.tool_input.file_path.includes('.env')) {
                return {
                  decision: 'block',
                  stopReason: 'Cannot write to environment files'
                };
              }
              
              // Allow the operation
              return { continue: true };
            }
          ]
        }
      ],
      PostToolUse: [
        {
          matcher: "Write|Edit",
          hooks: [
            async (input, toolUseId, { signal }) => {
              console.log(`File modified: ${input.tool_response.filePath}`);
              // Run your custom formatting or validation
              return { continue: true };
            }
          ]
        }
      ]
    }
  }
})) {
  if (message.type === "result") console.log(message.result);
}
```

### Available hook events

* **PreToolUse**: Runs before tool execution. Can block tools or provide feedback.
* **PostToolUse**: Runs after successful tool execution.
* **UserPromptSubmit**: Runs when user submits a prompt.
* **SessionStart**: Runs when a session starts.
* **SessionEnd**: Runs when a session ends.
* **Stop**: Runs when Claude is about to stop responding.
* **SubagentStop**: Runs when a subagent is about to stop.
* **PreCompact**: Runs before conversation compaction.
* **Notification**: Runs when notifications are sent.

### Hook input types

Each hook receives typed input based on the event:

```ts
// PreToolUse input
type PreToolUseHookInput = {
  hook_event_name: 'PreToolUse';
  session_id: string;
  transcript_path: string;
  cwd: string;
  permission_mode?: string;
  tool_name: string;
  tool_input: unknown;
}

// PostToolUse input
type PostToolUseHookInput = {
  hook_event_name: 'PostToolUse';
  session_id: string;
  transcript_path: string;
  cwd: string;
  permission_mode?: string;
  tool_name: string;
  tool_input: unknown;
  tool_response: unknown;
}
```

### Hook output

Hooks return output that controls execution flow:

```ts
interface HookJSONOutput {
  // Continue execution (default: true)
  continue?: boolean;
  
  // Suppress output to user
  suppressOutput?: boolean;
  
  // Stop reason (shown to model)
  stopReason?: string;
  
  // Decision for PreToolUse hooks
  decision?: 'approve' | 'block';
  
  // System message to show
  systemMessage?: string;
  
  // Hook-specific output
  hookSpecificOutput?: {
    // For PreToolUse
    permissionDecision?: 'allow' | 'deny' | 'ask';
    permissionDecisionReason?: string;
    
    // For UserPromptSubmit or PostToolUse
    additionalContext?: string;
  };
}
```

### Practical examples

#### Logging and monitoring

```ts
const hooks = {
  PreToolUse: [
    {
      hooks: [
        async (input) => {
          // Log all tool usage
          await logToMonitoring({
            event: 'tool_use',
            tool: input.tool_name,
            input: input.tool_input,
            session: input.session_id
          });
          
          return { continue: true };
        }
      ]
    }
  ]
};
```

#### File operation validation

```ts
const hooks = {
  PreToolUse: [
    {
      matcher: "Write|Edit",
      hooks: [
        async (input) => {
          const filePath = input.tool_input.file_path;
          
          // Block sensitive files
          const sensitivePatterns = ['.env', '.git/', 'secrets/', '*.key'];
          
          for (const pattern of sensitivePatterns) {
            if (filePath.includes(pattern)) {
              return {
                decision: 'block',
                stopReason: `Cannot modify sensitive file matching ${pattern}`
              };
            }
          }
          
          return { continue: true };
        }
      ]
    }
  ]
};
```

#### Auto-formatting code

```ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const hooks = {
  PostToolUse: [
    {
      matcher: "Write|Edit|MultiEdit",
      hooks: [
        async (input) => {
          const filePath = input.tool_response.filePath;
          
          // Auto-format based on file type
          if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
            await execAsync(`prettier --write "${filePath}"`);
          } else if (filePath.endsWith('.py')) {
            await execAsync(`black "${filePath}"`);
          }
          
          return { continue: true };
        }
      ]
    }
  ]
};
```

#### Prompt enhancement

```ts
const hooks = {
  UserPromptSubmit: [
    {
      hooks: [
        async (input) => {
          // Add context to prompts
          const projectContext = await loadProjectContext();
          
          return {
            continue: true,
            hookSpecificOutput: {
              hookEventName: 'UserPromptSubmit',
              additionalContext: `Project context: ${projectContext}`
            }
          };
        }
      ]
    }
  ]
};
```

#### Custom compaction instructions

```ts
const hooks = {
  PreCompact: [
    {
      hooks: [
        async (input) => {
          const trigger = input.trigger; // 'manual' or 'auto'
          
          return {
            continue: true,
            systemMessage: 'Focus on preserving implementation details and error resolutions'
          };
        }
      ]
    }
  ]
};
```

### Hook execution behavior

* **Parallelization**: All matching hooks run in parallel
* **Timeout**: Hooks respect the abort signal from options
* **Error handling**: Hook errors are logged but don't stop execution
* **Matchers**: Support regex patterns (e.g., `"Write|Edit"`)

### Combining hooks with canUseTool

While `canUseTool` provides permission control, hooks offer broader lifecycle integration:

```ts
for await (const message of query({
  prompt: "Build the feature",
  options: {
    // Fine-grained permission control
    canUseTool: async (toolName, input) => {
      // Modify inputs or deny based on runtime conditions
      return { behavior: "allow", updatedInput: input };
    },
    
    // Lifecycle hooks for monitoring and automation
    hooks: {
      PreToolUse: [
        {
          hooks: [
            async (input) => {
              // Log, validate, or prepare
              return { continue: true };
            }
          ]
        }
      ]
    }
  }
})) {
  // Process messages
}
```

## Permission control with canUseTool

The `canUseTool` callback provides fine-grained control over tool execution. It's called before each tool use and can allow, deny, or modify tool inputs:

```ts
type ToolPermissionResult = 
  | { behavior: "allow"; updatedInput?: any }
  | { behavior: "deny"; message?: string };

for await (const message of query({
  prompt: "Analyze user behavior and calculate metrics",
  options: {
    mcpServers: {
      "analytics": analyticsServer
    },
    canUseTool: async (toolName: string, input: any) => {
      // Control which tools can be used
      if (toolName.startsWith("mcp__analytics__")) {
        // Check permissions for analytics tools
        const hasPermission = await checkUserPermissions(toolName);
        
        return hasPermission
          ? { behavior: "allow", updatedInput: input }
          : { behavior: "deny", message: "Insufficient permissions" };
      }
      
      // Modify inputs for certain tools
      if (toolName === "Bash") {
        // Add safety checks or modify commands
        const safeInput = sanitizeBashCommand(input);
        return { behavior: "allow", updatedInput: safeInput };
      }
      
      // Allow other tools by default
      return { behavior: "allow", updatedInput: input };
    }
  }
})) {
  if (message.type === "result") console.log(message.result);
}
```

### Use cases for canUseTool

* **Permission management**: Check user permissions before allowing tool execution
* **Input validation**: Validate or sanitize tool inputs before execution
* **Rate limiting**: Implement rate limits for expensive operations
* **Audit logging**: Log tool usage for compliance or debugging
* **Dynamic permissions**: Enable/disable tools based on runtime conditions

```ts
// Example: Web scraping rate limiter
const rateLimits = new Map<string, { count: number; resetTime: number }>();

const canUseTool = async (toolName: string, input: any) => {
  // Rate limit web scraping to prevent IP bans and API quota issues
  if (toolName === "WebFetch" || toolName === "WebSearch") {
    const now = Date.now();
    const limit = rateLimits.get(toolName) || { count: 0, resetTime: now + 60000 };
    
    // Reset counter every minute
    if (now > limit.resetTime) {
      limit.count = 0;
      limit.resetTime = now + 60000;
    }
    
    // Allow max 10 requests per minute
    if (limit.count >= 10) {
      return { 
        behavior: "deny", 
        message: `Rate limit exceeded: max 10 ${toolName} requests per minute. Resets in ${Math.ceil((limit.resetTime - now) / 1000)}s` 
      };
    }
    
    limit.count++;
    rateLimits.set(toolName, limit);
    
    // Log scraping activity for monitoring
    console.log(`${toolName} request ${limit.count}/10 to: ${input.url || input.query}`);
  }
  
  // Prevent accidental infinite loops in bash scripts
  if (toolName === "Bash" && input.command?.includes("while true")) {
    return { 
      behavior: "deny", 
      message: "Infinite loops are not allowed" 
    };
  }
  
  return { behavior: "allow", updatedInput: input };
};
```

## Output formats

### Text output (default)

```ts
// Default text output
for await (const message of query({
  prompt: "Explain file src/components/Header.tsx"
})) {
  if (message.type === "result" && message.subtype === "success") {
    console.log(message.result);
    // Output: This is a React component showing...
  }
}
```

### JSON output

```ts
// Collect all messages for JSON-like access
const messages = [];
for await (const message of query({
  prompt: "How does the data layer work?"
})) {
  messages.push(message);
}

// Access result message with metadata
const result = messages.find(m => m.type === "result" && message.subtype === "success");
console.log({
  result: result.result,
  cost: result.total_cost_usd,
  duration: result.duration_ms
});
```

## Input formats

```ts
// Direct prompt
for await (const message of query({
  prompt: "Explain this code"
})) {
  if (message.type === "result" && message.subtype === "success") console.log(message.result);
}

// From variable
const userInput = "Explain this code";
for await (const message of query({ prompt: userInput })) {
  if (message.type === "result" && message.subtype === "success") console.log(message.result);
}
```

## Agent integration examples

### SRE incident response agent

```ts
import { query } from "@anthropic-ai/claude-code";

// Automated incident response agent
async function investigateIncident(
  incidentDescription: string,
  severity = "medium"
) {
  const messages = [];

  for await (const message of query({
    prompt: `Incident: ${incidentDescription} (Severity: ${severity})`,
    options: {
      appendSystemPrompt: "You are an SRE expert. Diagnose the issue, assess impact, and provide immediate action items.",
      maxTurns: 6,
      allowedTools: ["Bash", "Read", "WebSearch", "mcp__datadog"],
      mcpConfig: "monitoring-tools.json"
    }
  })) {
    messages.push(message);
  }

  return messages.find(m => m.type === "result" && message.subtype === "success");
}

// Usage
const result = await investigateIncident("Payment API returning 500 errors", "high");
console.log(result.result);
```

### Automated security review

```ts
import { query } from "@anthropic-ai/claude-code";
import { execSync } from "child_process";

async function auditPR(prNumber: number) {
  // Get PR diff
  const prDiff = execSync(`gh pr diff ${prNumber}`, { encoding: 'utf8' });

  const messages = [];
  for await (const message of query({
    prompt: prDiff,
    options: {
      appendSystemPrompt: "You are a security engineer. Review this PR for vulnerabilities, insecure patterns, and compliance issues.",
      maxTurns: 3,
      allowedTools: ["Read", "Grep", "WebSearch"]
    }
  })) {
    messages.push(message);
  }

  return messages.find(m => m.type === "result" && message.subtype === "success");
}

// Usage
const report = await auditPR(123);
console.log(JSON.stringify(report, null, 2));
```

### Multi-turn legal assistant

```ts
import { query } from "@anthropic-ai/claude-code";

async function legalReview() {
  // Start legal review session
  let sessionId: string;

  for await (const message of query({
    prompt: "Start legal review session",
    options: { maxTurns: 1 }
  })) {
    if (message.type === "system" && message.subtype === "init") {
      sessionId = message.session_id;
    }
  }

  // Multi-step review using same session
  const steps = [
    "Review contract.pdf for liability clauses",
    "Check compliance with GDPR requirements",
    "Generate executive summary of risks"
  ];

  for (const step of steps) {
    for await (const message of query({
      prompt: step,
      options: { resume: sessionId, maxTurns: 2 }
    })) {
      if (message.type === "result" && message.subtype === "success") {
        console.log(`Step: ${step}`);
        console.log(message.result);
      }
    }
  }
}
```

## Message schema

Messages returned from the JSON API are strictly typed according to the following schema:

```ts
type SDKMessage =
  // An assistant message
  | {
      type: "assistant";
      uuid: string;
      session_id: string;
      message: Message; // from Anthropic SDK
      parent_tool_use_id: string | null;
    }

  // A user message (input)
  | {
      type: "user";
      uuid?: string;
      session_id: string;
      message: MessageParam; // from Anthropic SDK
      parent_tool_use_id: string | null;
    }

  // A user message (output/replay with required UUID)
  | {
      type: "user";
      uuid: string;
      session_id: string;
      message: MessageParam; // from Anthropic SDK
      parent_tool_use_id: string | null;
    }

  // Emitted as the last message on success
  | {
      type: "result";
      subtype: "success";
      uuid: UUID;
      session_id: string;
      duration_ms: number;
      duration_api_ms: number;
      is_error: boolean;
      num_turns: number;
      result: string;
      total_cost_usd: number;
      usage: Usage;
      permission_denials: SDKPermissionDenial[];
    }

  // Emitted as the last message on error or max turns
  | {
      type: "result";
      subtype: "error_max_turns" | "error_during_execution";
      uuid: UUID;
      session_id: string;
      duration_ms: number;
      duration_api_ms: number;
      is_error: boolean;
      num_turns: number;
      total_cost_usd: number;
      usage: Usage;
      permission_denials: SDKPermissionDenial[];
    }

  // Emitted as the first message at the start of a conversation
  | {
      type: "system";
      subtype: "init";
      uuid: UUID;
      session_id: string;
      apiKeySource: "user" | "project" | "org" | "temporary";
      cwd: string;
      tools: string[];
      mcp_servers: {
        name: string;
        status: string;
      }[];
      model: string;
      permissionMode: "default" | "acceptEdits" | "bypassPermissions" | "plan";
      slash_commands: string[];
      output_style: string;
    };

  type SDKPermissionDenial = {
    tool_name: string;
    tool_use_id: string;
    tool_input: Record<string, unknown>;
  }

```

Additional supporting types:

`Message`, `MessageParam`, and `Usage` types are available in the Anthropic [TypeScript SDK](https://github.com/anthropics/anthropic-sdk-typescript).

## Related resources

* [CLI usage and controls](/en/docs/claude-code/cli-reference) - Complete CLI documentation
* [GitHub Actions integration](/en/docs/claude-code/github-actions) - Automate your GitHub workflow with Claude
* [Common workflows](/en/docs/claude-code/common-workflows) - Step-by-step guides for common use cases
