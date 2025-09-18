# Logging

Lix includes a lightweight, built-in logging system that writes structured data directly into Lix. This allows you to capture, query, and version logs alongside your application state, making them perfect for audit trails, debugging breadcrumbs, and collaborative session histories.

## Quick Start

Add a log entry by inserting a row directly into the `log` table.

```ts
import { openLix } from "@lix-js/sdk";

const lix = await openLix({});

// The `id` and `timestamp` are automatically generated on insertion.
await lix.db
  .insertInto("log")
  .values({
    key: "app_boot_success",
    level: "info",
    message: "Application booted and ready.",
  })
  .execute();
```

## When to Use Lix Logging

Use Lix for logs that are part of your application's state. Because logs are stored and versioned in the repository, they are queryable, shareable, and available long after the original process has exited.

| Use Lix Logging For...                       | Use `console.log` For...                    |
| -------------------------------------------- | ------------------------------------------- |
| **User-facing logs** (errors, activity)   | **Developer-only diagnostics**              |
| **Persistent state** to be queried & synced  | **Ephemeral data** for immediate inspection |
| **Testable application logic**               | **Debugging the current execution**         |

## Querying Logs

Logs are stored in the `log` table and can be queried with the same Kysely API you use for other entities.

```ts
const recentErrors = await lix.db
  .selectFrom("log")
  .selectAll()
  .where("level", "=", "error")
  .orderBy("timestamp", "desc")
  .limit(10)
  .execute();
```

Since logs are part of change control, you can inspect them at different points in history, diff them between commits, and sync them across clients.

## Common Use Cases

A primary use case for Lix Logging is to create a queryable history of events that can be surfaced to end-users in your application's UI.

### Displaying Errors to Users

Instead of only logging errors to the console where they are lost, you can write them to Lix. This allows you to build an in-app "Error History" or "Activity" panel, giving users or support staff visibility into what went wrong.

**1. Log an error when it occurs:**
```ts
async function handleSubmit(formData) {
  try {
    await submitData(formData);
  } catch (error) {
    await createLog({
      lix,
      key: 'form_submit_failed',
      level: 'error',
      message: `Submission failed: ${error.message}`,
    });
    // Also notify the user immediately
  }
}
```

**2. Query the logs to display in the UI:**

You can create a React component, for example, that queries and displays all error logs.

```tsx
function ErrorHistoryPanel({ lix }) {
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    const fetchErrors = async () => {
      const result = await lix.db
        .selectFrom('log')
        .where('level', '=', 'error')
        .orderBy('timestamp', 'desc')
        .limit(50)
        .selectAll()
        .execute();
      setErrors(result);
    };

    fetchErrors();
  }, [lix]); // Re-run if lix instance changes

  return (
    <div>
      <h3>Error History</h3>
      <ul>
        {errors.map(error => (
          <li key={error.id}>
            <strong>{error.key}</strong>: {error.message} ({error.timestamp})
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Best Practices

- **Use structured `snake_case` keys**: This makes filtering predictable (e.g., `checkout_form_submit`, `checkout_form_error`).
- **Store meaningful levels**: Use levels that match your observability pipeline (e.g., `info`, `warn`, `error`, `debug`).
- **Prune test data**: In long-running test suites, remember that the `log` table grows. Prune it if it's not relevant to your test assertions to keep fixtures small.

## Schema

The default `log` table provides a minimal, effective schema.

| Column    | Type     | Description                                     |
| --------- | -------- | ----------------------------------------------- |
| `id`      | `string` | A unique identifier for the log entry.          |
| `timestamp` | `string` | ISO 8601 timestamp of when the log was created. |
| `key`     | `string` | A structured, `snake_case` key for filtering.   |
| `level`   | `string` | The log level (e.g., `info`, `error`).          |
| `message` | `string` | The descriptive log message.                    |

