# Markdown-Plate-Fork Plugin Tests

This directory contains tests for the Markdown-Plate-Fork plugin, focusing on roundtrip testing (markdown → editor → markdown).

## Testing Approach

These tests use direct object comparison with the actual Slate format, matching the exact structure returned by the deserialization functions. This approach has several advantages:

1. It tests against the actual structure returned by the API
2. It avoids JSX transformation complexities 
3. It uses the same structure format that the code produces and consumes

Example test expectation:
```ts
const expected = [
  {
    type: 'p',
    children: [{ text: 'Paragraph text' }],
  }
];
```

This matches the exact object structure that Slate uses internally, making the tests more reliable and easier to debug.

The test suite includes tests for:
1. Roundtrip transformations (markdown → editor → markdown)
2. Deserialization (markdown → editor structure)
3. Serialization (editor structure → markdown)
4. Edge cases (complex scenarios and error handling)

## Running Tests

You can run the tests using Vitest. From the project root:

```bash
# Run all tests
npx vitest run

# Run tests and watch for changes
npx vitest

# Run specific test files
npx vitest run src/components/editor/plugins/markdown-plate-fork/__tests__/roundtrip.spec.ts
```

## Test Structure

The tests are organized as follows:

- `test-helpers.ts`: Utility functions for creating test editors and normalizing markdown
- `roundtrip.spec.ts`: Roundtrip tests for converting markdown to editor and back
- `deserialize.spec.ts`: Tests for markdown → editor conversion
- `serialize.spec.ts`: Tests for editor → markdown conversion
- `edge-cases.spec.ts`: Tests for handling edge cases and complex scenarios

## Adding New Tests

To add new tests:

1. Add test cases to the `testCases` object in `test-helpers.ts`
2. Create test functions in the appropriate spec file
3. Run the tests to verify everything works

## Debugging Tips

- When roundtrip tests fail, separately run the deserialize and serialize tests to pinpoint which direction is failing
- Use `console.log()` to inspect the editor's internal state during tests
- Compare the input and output markdown after normalization
- For edge cases, consider adding explicit tests with known problematic inputs