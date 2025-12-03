# Lix JS SDK

[![NPM Downloads](https://img.shields.io/npm/dw/%40lix-js%2Fsdk?logo=npm&logoColor=red&label=npm%20downloads)](https://www.npmjs.com/package/@lix-js/sdk) [![Discord](https://img.shields.io/discord/897438559458430986?style=flat&logo=discord&labelColor=white)](https://discord.gg/gdMPPWy57R) [![X (Twitter)](https://img.shields.io/badge/Follow-@lixCCS-black?logo=x&logoColor=white)](https://x.com/lixCCS)

> [!NOTE]
> **Lix is in beta** · [Follow progress to v1.0 →](https://github.com/opral/lix-sdk/issues/374)

Lix is an embeddable change control system that enables Git-like features such as [history](https://lix.dev/docs/history), [versions](https://lix.dev/docs/versions) (branches), [diffs](https://lix.dev/docs/), or [blame](https://lix.dev/docs/attribution) for any file format.

**What makes Lix unique:**

- **Supports any file format** - Track changes in `.xlsx`, `.pdf`, `.json` etc. via plugins.
- **SQL powered** - History, versions, and diffs are all queryable via SQL.
- **Embedded** - Runs as a single SQLite file, persistable anywhere (local FS, S3, your database).

---

**📖 [Go to lix.dev for more information →](https://lix.dev)**

---

## Use Cases

- **AI agent sandboxing** - Agents propose changes, humans review and approve before applying.
- **Applications with change control** - Branch/merge-style reviews, audit trails, and versioning for structured data.


## Quick Start

```bash
npm install @lix-js/sdk @lix-js/plugin-json
```

```ts
import { openLix, selectWorkingDiff, InMemoryEnvironment } from "@lix-js/sdk";
import { plugin as json } from "@lix-js/plugin-json";

// 1) Open a lix with plugins
const lix = await openLix({
	environment: new InMemoryEnvironment(),
	providePlugins: [json],
});

// 2) Write a file via SQL
await lix.db
	.insertInto("file")
	.values({
		path: "/settings.json",
		data: new TextEncoder().encode(JSON.stringify({ theme: "light" })),
	})
	.execute();

// 3) Query the changes
const diff = await selectWorkingDiff({ lix }).execute();
console.log(diff);
```

## Learn More

- **[Getting Started Guide](https://lix.dev/docs/getting-started)** - Build your first app with Lix
- **[Documentation](https://lix.dev/docs)** - Full API reference and guides
- **[Discord](https://discord.gg/gdMPPWy57R)** - Get help and join the community
- **[GitHub](https://github.com/opral/lix-sdk)** - Report issues and contribute

## License

[MIT](https://github.com/opral/monorepo/blob/main/packages/lix/sdk/LICENSE)
