# Deterministic Mode

> **Who is this for?** If you're testing, debugging, or simulating distributed systems with Lix and need predictable, reproducible behavior across runs, deterministic mode is for you.

Use deterministic mode for:

- **Testing** - Unit and integration tests that produce identical results every run
- **Debugging** - Reproduce exact sequences of events from bug reports
- **Simulations** - Run deterministic simulations across multiple environments

## Quick Example

**Normal mode (default)** - different results each run:
```ts
import { openLix, timestamp, random } from "@lix-js/sdk";

const lix = await openLix({ blob });

timestamp({ lix }); // "2024-03-15T10:32:45.123Z" (current time)
timestamp({ lix }); // "2024-03-15T10:32:45.124Z" (real time passes)
random({ lix });    // 0.7234... (unpredictable)
random({ lix });    // 0.1823... (unpredictable)
```

**Deterministic mode** - same results every run:

```ts
const lix = await openLix({ 
  blob,
  keyValues: [{
    key: "lix_deterministic_mode",
    value: {
      enabled: true
    },
    lixcol_version_id: "global"
  }]
});

timestamp({ lix }); // "1970-01-01T00:00:00.000Z" (always epoch)
timestamp({ lix }); // "1970-01-01T00:00:00.001Z" (always +1ms)
random({ lix });    // 0.318... (always this sequence)
random({ lix });    // 0.937... (always this sequence)
```

## Configuration

### Basic Setup

Enable deterministic mode when opening a Lix:

```ts
const lix = await openLix({
  blob,
  keyValues: [
    {
      key: "lix_deterministic_mode",
      value: {
        enabled: true
      },
      lixcol_version_id: "global"
    }
  ],
});
```

Or enable it after opening:

```ts
await lix.db
  .updateTable("key_value_all")
  .set({ value: { enabled: true } })
  .where("key", "=", "lix_deterministic_mode")
  .where("lixcol_version_id", "=", "global")
  .execute();
```

### Deterministic Bootstrap (Optional)

For tests requiring fully reproducible behavior from creation:

```ts
// Creates a new Lix with deterministic IDs and timestamps
const lix = await openLix({
  keyValues: [
    {
      key: "lix_deterministic_mode",
      value: {
        enabled: true,
        bootstrap: true
      },
      lixcol_version_id: "global"
    }
  ],
});
```

> [!NOTE]
> **Choosing the right bootstrap mode:**
> - Use **deterministic bootstrap** for reproducibility testing that doesn't involve distribution (e.g., unit tests, regression tests)
> - Use **non-deterministic bootstrap** (default) for distributed testing scenarios (e.g., simulating multiple Lix instances syncing)

### Configuration Options

The deterministic mode is configured through a single key-value object:

| Key | Type | Description |
| --- | ---- | ----------- |
| `lix_deterministic_mode` | object | Configuration object for deterministic mode |

The configuration object has the following properties:

| Property | Type | Default | Description |
| -------- | ---- | ------- | ----------- |
| `enabled` | boolean | *required* | Enable/disable deterministic mode |
| `bootstrap` | boolean | `false` | Use deterministic IDs during Lix creation |
| `timestamp` | boolean | `true` | Use deterministic timestamps |
| `random_seed` | string | `"lix-deterministic-seed"` | Seed for the random number generator |
| `nano_id` | boolean | `true` | Use deterministic nano ID generation |
| `uuid_v7` | boolean | `true` | Use deterministic UUID v7 generation |

## Advanced Usage

### Different RNG Seeds

To make multiple Lix instances behave differently in deterministic mode:

```ts
// Set seed when opening
const lix1 = await openLix({
  blob,
  keyValues: [
    {
      key: "lix_deterministic_mode",
      value: {
        enabled: true,
        random_seed: "instance-1"
      },
      lixcol_version_id: "global"
    }
  ]
});

// Or update seed after opening using SQLite's json_set function
import { sql } from "@lix-js/sdk";

await lix.db
  .updateTable("key_value_all")
  .set({ 
    value: sql`json_set(value, '$.random_seed', 'instance-2')`
  })
  .where("key", "=", "lix_deterministic_mode")
  .where("lixcol_version_id", "=", "global")
  .execute();
```

### State Persistence

Deterministic state is automatically persisted:

| Event | State Flushed? |
| ----- | -------------- |
| Successful mutating transaction | ✅ |
| `lix.toBlob()` / `lix.close()` | ✅ |
| Read-only transaction | ❌ |
| Transaction rollback/error | ❌ |

All state is stored in `internal_state_all_untracked` with `version_id = "global"`.

## API Quick-Links

The following functions provide deterministic behavior when `lix_deterministic_mode` is enabled:

| Function | Purpose | Docs |
| -------- | ------- | ---- |
| `timestamp({ lix })` | Logical clock timestamps | [API docs](/api/functions/timestamp) |
| `random({ lix })` | Reproducible random numbers | [API docs](/api/functions/random) |
| `uuidV7({ lix })` | Deterministic UUID v7 generation | [API docs](/api/functions/uuidV7) |
| `nanoId({ lix })` | Deterministic nano ID generation | [API docs](/api/functions/nanoId) |
| `nextDeterministicSequenceNumber({ lix })` | Monotonic counter (advanced) | [API docs](/api/functions/nextDeterministicSequenceNumber) |