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
  keyValues: [{ key: "lix_deterministic_mode", value: true, lixcol_version_id: "global" }]
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
    { key: "lix_deterministic_mode", value: true, lixcol_version_id: "global" }
  ],
});
```

Or enable it after opening:

```ts
await lix.db
  .updateTable("key_value_all")
  .set({ value: true })
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
    { key: "lix_deterministic_bootstrap", value: true, lixcol_version_id: "global" },
    { key: "lix_deterministic_mode", value: true, lixcol_version_id: "global" },
  ],
});
```

> [!NOTE]
> **Choosing the right bootstrap mode:**
> - Use **deterministic bootstrap** for reproducibility testing that doesn't involve distribution (e.g., unit tests, regression tests)
> - Use **non-deterministic bootstrap** (default) for distributed testing scenarios (e.g., simulating multiple Lix instances syncing)

### Key Values

| Key | Type | Purpose |
| --- | ---- | ------- |
| `lix_deterministic_mode` | boolean | Runtime determinism (PRNG, sequence, clock) once the repo exists |
| `lix_deterministic_bootstrap` | boolean | Reproducible bootstrap when creating new Lix (deterministic IDs like "deterministic-lix-id", epoch timestamps). Only applies when no blob is provided. |
| `lix_deterministic_rng_seed` | string | Custom seed for the random number generator. Defaults to `lix_id` if not specified. |

## Advanced Usage

### Different RNG Seeds

To make multiple Lix instances behave differently in deterministic mode:

```ts
// Set seed when opening
const lix1 = await openLix({
  blob,
  keyValues: [
    { key: "lix_deterministic_mode", value: true, lixcol_version_id: "global" },
    { key: "lix_deterministic_rng_seed", value: "instance-1", lixcol_version_id: "global" }
  ]
});

// Or update seed after opening
await lix2.db
  .updateTable("key_value_all")
  .set({ value: "instance-2" })
  .where("key", "=", "lix_deterministic_rng_seed")
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