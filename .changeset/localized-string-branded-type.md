---
"@inlang/paraglide-js": minor
---

Add `LocalizedString` branded type for compile-time i18n safety.

Message functions now return `LocalizedString` instead of `string`, enabling TypeScript users to distinguish between translated and untranslated strings at compile time. This is fully backward compatible since branded types are assignable to their base type.

```typescript
import { m } from './paraglide/messages.js'
import type { LocalizedString } from '@inlang/paraglide-js'

const greeting: LocalizedString = m.hello() // ✓ Type-safe
const raw: LocalizedString = "Hello"        // ✗ Type error
```
