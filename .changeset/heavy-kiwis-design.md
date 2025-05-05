---
"@lix-js/sdk": minor
---

Refactor: The `key_value` table now uses JSON(B) as value instead of TEXT.

Using JSON as value increases the versatility of the table and allows for more complex values. Storing JSON was possible before via `JSON.stringify()` and a manual `JSON.parse()` in the application code but felt unnatural given that other tables support JSON natively.

Closes https://github.com/opral/lix-sdk/issues/283
