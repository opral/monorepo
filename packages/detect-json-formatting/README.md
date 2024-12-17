# @inlang/detect-json-formatting

Detects the formatting of a JSON file and returns a function to serialize the JSON file in the same format.

- useful to minimize git diffs and merge conflicts

## Usage

```ts
import { detectJsonFormatting } from "@inlang/detect-json-formatting";

const file = fs.readFileSync("./messages.json", "utf-8");
const json = JSON.parse(file);
const stringify = detectJsonFormatting(file);
const serialized = stringify(json);

// serialized === file (same formatting)
```
