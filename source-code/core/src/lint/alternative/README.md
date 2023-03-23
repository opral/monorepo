# Concept

```ts
// 1. create lint rule [Public API: Authoring rules]
const missingMessageRule = createLintRule({ id: "inlang.missingMessage" }, ({ config, report }) => {
	visitors: {
    Resource: ({ target } => {
      report(target, { message: "Missing message" })
    })
	}
})

// 2. configure rule function [Public API: Using rules]
rules: [
  missingMessageRule("error", {
    strict: true,
  })
]

// 3. setup rule function [Internal]
const rules = rules.map((rule) => await ruleSetup({ config, report }))

// 4. linting
const [resource, errors] = await lint(resources, [rule])
```
