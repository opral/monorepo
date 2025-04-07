# Lix Agent Tests

This directory contains tests for the Lix Agent CLI.

## Running Tests

To run the tests:

```bash
# Run all tests
pnpm test

# Run specific tests
pnpm test -- tests/validate.test.ts

# Run tests with coverage
pnpm test:coverage
```

## Test Structure

- `agent.test.ts` - Tests for the core Agent class functionality
- `validate.test.ts` - Tests for content validation functions

## Writing New Tests

When adding new tests:

1. Create a new test file in this directory
2. Import the necessary functions and classes
3. Use the Vitest testing framework
4. Make sure to mock external dependencies

Example:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { MyFunction } from '../src/path-to-function';

describe('MyFunction', () => {
  it('should do something correctly', () => {
    const result = MyFunction('input');
    expect(result).toBe('expected output');
  });
});
```