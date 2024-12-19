---
"@lix-js/sdk": patch
---

refactor: remove `comment.created_at` and `comment.created_by` https://github.com/opral/lix-sdk/issues/175

Comments and discussions are now change controlled. Hence, knowing when a comment or discussion has been created can be queried via the changes. This removes the need for the `created_at` and `created_by` fields on the `Comment` and `Discussion` entities, and thereby simplifies the schema, avoids duplicate date, and reduces the risk of inconsistencies.
