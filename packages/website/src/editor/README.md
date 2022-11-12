Source code for the editor.

### Why is the editor not in a separate module?

The editor lives under `@inlang/website` to share as much code as possible. See RFC-002 tech stack.

### Why is the editor not in `/pages`?

The editor is separate from the "website pages" to ease future extraction of the editor into a dedicated module if required.
