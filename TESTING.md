# Testing Guide

This project uses [Vitest](https://vitest.dev/) for unit testing along with React Testing Library for component tests.

## Setup

First, install the required dependencies:

```bash
npm install --save-dev vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitest/coverage-v8
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm test -- --watch
```

### Run tests with UI
```bash
npm run test:ui
```

### Run tests with coverage
```bash
npm run test:coverage
```

## Test Structure

Tests are colocated with the source files using the `.test.ts` or `.test.tsx` extension:

```
src/
├── utils/
│   ├── audioEstimator.ts
│   ├── audioEstimator.test.ts
│   ├── contentGenerator.ts
│   ├── contentGenerator.test.ts
│   ├── enhancedContentGenerator.ts
│   └── enhancedContentGenerator.test.ts
└── test/
    └── setup.ts  # Test setup and global configuration
```

## Test Coverage

Current test coverage includes:

- **AudioEstimator**: Complete coverage of audio duration and cost estimation
- **ContentGenerator**: API integration, error handling, and fallback content
- **EnhancedContentGenerator**: Personalized content generation with various configurations

## Writing New Tests

### Utility Function Tests

```typescript
import { describe, it, expect } from 'vitest';
import { yourFunction } from './yourFile';

describe('yourFunction', () => {
  it('should handle expected input correctly', () => {
    const result = yourFunction('input');
    expect(result).toBe('expected output');
  });
});
```

### Component Tests

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { YourComponent } from './YourComponent';

describe('YourComponent', () => {
  it('should render correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### API Mocking

```typescript
import { vi } from 'vitest';

global.fetch = vi.fn();

(global.fetch as any).mockResolvedValueOnce({
  ok: true,
  json: async () => ({ data: 'mocked response' }),
});
```

## Best Practices

1. **Test behavior, not implementation**: Focus on what the function does, not how it does it
2. **Use descriptive test names**: Make it clear what each test is verifying
3. **Arrange-Act-Assert pattern**: Structure tests with clear setup, execution, and verification
4. **Mock external dependencies**: Isolate the code under test
5. **Test edge cases**: Include tests for error conditions, empty inputs, and boundary values

## CI/CD Integration

To run tests in CI/CD pipelines:

```bash
# Run tests once without watch mode
npm test -- --run

# Run with coverage and fail if below threshold
npm test -- --run --coverage --coverage.lines=80
```

## Troubleshooting

### Import.meta.env issues
The test setup file mocks environment variables. Add new ones to `src/test/setup.ts` if needed.

### Async test timeouts
Increase the timeout for slow tests:

```typescript
it('should handle slow operation', async () => {
  // test code
}, 10000); // 10 second timeout
```

### Module resolution errors
Ensure your `vitest.config.ts` has the correct path alias configuration.
