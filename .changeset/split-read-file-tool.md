---
"@lix-js/agent-sdk": patch
---

Split `read_file` tool into `read_file_by_path` and `read_file_by_id` to eliminate parameter overload validation errors, and improve file not found error messages to suggest using `list_files`.
