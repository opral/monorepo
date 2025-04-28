# Zettel HTML

Zettel HTML provides a roundtrip parsing between the Zettel AST and HTML markup.

- great for theming with CSS
- great for interoperable copy & pasting

## Installation & Usage

```bash
npm i @opral/zettel-html
```

```ts
import { toHtmlString, fromHtmlString } from "@opral/zettel-html";
```

```ts
const doc = [
	{
		_type: "zettel.textBlock",
		_key: "abc123",
		style: "zettel.normal",
		markDefs: [],
		children: [
			{
				_type: "zettel.span",
				_key: "def456",
				text: "Hello!",
				marks: [],
			},
		],
	},
];

const html = toHtmlString(doc);
// html => '<div data-zettel-doc="true"><p data-zettel-key="abc123">...'</div>'

const parsedDoc = fromHtmlString(html);
// parsedDoc => doc
```
