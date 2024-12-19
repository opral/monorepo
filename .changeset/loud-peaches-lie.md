---
"@lix-js/sdk": patch
---

refactor: remove `change_set_label_author` table. 

Closes https://github.com/opral/lix-sdk/issues/227

Change set labels are now under own change control. Querying who created a label can happen via the change table itself. 