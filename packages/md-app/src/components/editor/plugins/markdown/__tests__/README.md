# Markdown Plugin Tests

This directory contains tests for the Markdown plugin, focusing on roundtrip testing (markdown → editor → markdown).

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

## Running Tests

You can run the tests using Vitest. From the project root:

```bash
# Run all tests
npx vitest run

# Run tests and watch for changes
npx vitest

# Run specific test files
npx vitest run src/components/editor/plugins/markdown/__tests__/roundtrip.spec.ts
```

## Test Structure

The tests are organized as follows:

- `test-helpers.ts`: Utility functions for creating test editors and normalizing markdown
- `roundtrip.spec.ts`: Roundtrip tests for converting markdown to editor and back
- `deserialize.spec.ts`: Tests for markdown → editor conversion
- `serialize.spec.ts`: Tests for editor → markdown conversion

## Adding New Tests

To add new tests:

1. Add test cases to the `testCases` object in `test-helpers.ts`
2. Create test functions in the appropriate spec file
3. Run the tests to verify everything works

## Debugging Tips

- When roundtrip tests fail, separately run the deserialize and serialize tests to pinpoint which direction is failing
- Use `console.log()` to inspect the editor's internal state during tests
- Compare the input and output markdown after normalization