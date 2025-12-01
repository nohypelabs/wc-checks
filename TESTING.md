# Testing Guide - WC-Checks

**Testing Framework:** Vitest + React Testing Library
**Version:** 3.0.0
**Last Updated:** 2025-12-01

---

## 📋 Table of Contents

- [Overview](#overview)
- [Testing Stack](#testing-stack)
- [Testing Strategy](#testing-strategy)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Coverage](#test-coverage)
- [Best Practices](#best-practices)
- [CI/CD Integration](#cicd-integration)

---

## 🎯 Overview

WC-Checks uses a **pragmatic testing approach**:

- **Unit Tests** for critical UI components
- **Integration Tests** for complex user flows
- **Manual Testing** for visual/UX validation
- **No E2E tests** (yet) - focus on unit + integration first

### Testing Philosophy:

```
┌────────────────────────────────────────────┐
│    Test What Matters (80/20 Rule)         │
├────────────────────────────────────────────┤
│  ✅ Critical user flows (inspection form)  │
│  ✅ Authentication & authorization         │
│  ✅ Data validation & error handling       │
│  ✅ Reusable UI components                 │
│  ❌ Trivial components (div wrappers)      │
│  ❌ Third-party library internals          │
└────────────────────────────────────────────┘
```

**Goal:** 70% code coverage on critical paths, not 100% everywhere.

---

## 🛠️ Testing Stack

### Core Libraries:

| Library | Version | Purpose |
|---------|---------|---------|
| **Vitest** | 4.0.9 | Test runner (Vite-native) |
| **@testing-library/react** | 16.3.0 | React component testing |
| **@testing-library/user-event** | 14.6.1 | User interaction simulation |
| **@testing-library/jest-dom** | 6.9.1 | DOM matchers |
| **jsdom** | 27.2.0 | Browser environment simulator |

### Why Vitest?

| Feature | Vitest | Jest |
|---------|--------|------|
| **Speed** | ⚡⚡⚡ Ultra Fast | ⚡⚡ Fast |
| **Vite Integration** | ✅ Native | ❌ Requires config |
| **ESM Support** | ✅ Built-in | ⚠️ Experimental |
| **Watch Mode** | ✅ Instant HMR | ⚠️ Slower |
| **Config** | ✅ Reuses vite.config | ❌ Separate config |

---

## 📊 Testing Strategy

### Test Pyramid:

```
        ┌──────────┐
        │   E2E    │  (Future)
        │  (None)  │
        └──────────┘
      ┌──────────────┐
      │ Integration  │  (20%)
      │   Tests      │
      └──────────────┘
    ┌──────────────────┐
    │   Unit Tests     │  (80%)
    │  (Components)    │
    └──────────────────┘
```

### What to Test:

#### **1. UI Components (Unit Tests)**

**Test:**
- Rendering with different props
- User interactions (click, input, submit)
- Conditional rendering (loading, error states)
- Accessibility (ARIA, keyboard navigation)

**Example:**
```typescript
// components/ui/Button.test.tsx
describe('Button', () => {
  it('should render with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click</Button>);
    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when loading', () => {
    render(<Button loading>Submit</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

---

#### **2. Hooks (Unit Tests)**

**Test:**
- Return values
- State updates
- Side effects
- Error handling

**Example:**
```typescript
// hooks/useAuth.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from './useAuth';

describe('useAuth', () => {
  it('should return null user when not authenticated', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull();
  });

  it('should return user after login', async () => {
    const { result } = renderHook(() => useAuth());

    // Simulate login
    await result.current.signIn('test@example.com', 'password');

    await waitFor(() => {
      expect(result.current.user).not.toBeNull();
      expect(result.current.user?.email).toBe('test@example.com');
    });
  });

  it('should handle auth errors', async () => {
    const { result } = renderHook(() => useAuth());

    await expect(
      result.current.signIn('invalid@email', 'wrong')
    ).rejects.toThrow();
  });
});
```

---

#### **3. Forms (Integration Tests)**

**Test:**
- Form validation
- Submit handling
- Error messages
- Success states

**Example:**
```typescript
// components/forms/InspectionForm.test.tsx
describe('InspectionForm', () => {
  it('should validate required fields', async () => {
    const user = userEvent.setup();
    render(<InspectionForm locationId="loc-123" />);

    // Try to submit empty form
    await user.click(screen.getByRole('button', { name: /submit/i }));

    // Should show validation errors
    expect(screen.getByText(/cleanliness is required/i)).toBeInTheDocument();
    expect(screen.getByText(/supplies is required/i)).toBeInTheDocument();
  });

  it('should submit valid form', async () => {
    const onSuccess = vi.fn();
    const user = userEvent.setup();

    render(<InspectionForm locationId="loc-123" onSuccess={onSuccess} />);

    // Fill form
    await user.selectOptions(screen.getByLabelText(/cleanliness/i), 'excellent');
    await user.click(screen.getByLabelText(/supplies available/i));

    // Submit
    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
```

---

#### **4. Utility Functions (Unit Tests)**

**Test:**
- Input/output correctness
- Edge cases
- Error handling

**Example:**
```typescript
// lib/utils.test.ts
describe('formatDate', () => {
  it('should format date correctly', () => {
    const date = new Date('2025-12-01');
    expect(formatDate(date)).toBe('December 1, 2025');
  });

  it('should handle invalid date', () => {
    expect(() => formatDate(null)).toThrow('Invalid date');
  });
});
```

---

### What NOT to Test:

❌ **Third-party libraries** (React Query, Supabase, etc.)
❌ **Simple wrapper components** (no logic)
❌ **CSS styles** (use visual regression testing tools instead)
❌ **Backend API** (test backend separately)

---

## 🚀 Running Tests

### Commands:

```bash
# Run all tests (watch mode)
pnpm test

# Run tests once (CI mode)
pnpm test:run

# Run tests with UI (Vitest UI)
pnpm test:ui

# Run tests with coverage
pnpm test:coverage
```

### Watch Mode (Development):

```bash
pnpm test

# Vitest CLI options:
# ↵ Press Enter to rerun all tests
# a Press a to run all tests
# f Press f to run only failed tests
# q Press q to quit
```

### Coverage Report:

```bash
pnpm test:coverage

# Output:
# ✓ src/components/ui/Button.test.tsx (17 tests)
# ✓ src/components/ui/Badge.test.tsx (8 tests)
# ✓ src/lib/utils.test.ts (12 tests)
#
# Coverage:
# File      | % Stmts | % Branch | % Funcs | % Lines
# ----------|---------|----------|---------|--------
# All files |   73.24 |    68.12 |   76.45 |   73.24
```

---

## ✍️ Writing Tests

### Test File Structure:

```
src/
├── components/
│   └── ui/
│       ├── Button.tsx
│       └── Button.test.tsx         # ✅ Co-located with component
├── hooks/
│   ├── useAuth.ts
│   └── useAuth.test.ts             # ✅ Co-located with hook
└── lib/
    ├── utils.ts
    └── utils.test.ts               # ✅ Co-located with utility
```

### Naming Convention:

```typescript
// ✅ GOOD: Descriptive test names
describe('Button', () => {
  describe('Rendering', () => {
    it('should render button with children', () => {});
    it('should render with default variant and size', () => {});
  });

  describe('Click Handling', () => {
    it('should call onClick handler when clicked', () => {});
    it('should not call onClick when disabled', () => {});
  });
});

// ❌ BAD: Vague test names
describe('Button', () => {
  it('works', () => {});
  it('test 1', () => {});
});
```

---

### Testing Components:

#### **Basic Rendering**

```typescript
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

it('should render button with text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
});
```

#### **User Interactions**

```typescript
import userEvent from '@testing-library/user-event';

it('should handle click event', async () => {
  const handleClick = vi.fn();
  const user = userEvent.setup();

  render(<Button onClick={handleClick}>Click</Button>);
  await user.click(screen.getByRole('button'));

  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

#### **Async Operations**

```typescript
import { waitFor } from '@testing-library/react';

it('should show loading state', async () => {
  render(<DataFetcher />);

  expect(screen.getByText('Loading...')).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
});
```

#### **Query Priorities (React Testing Library)**

Use queries in this order:

1. **Accessible queries** (preferred):
   - `getByRole` - Best for buttons, links, etc.
   - `getByLabelText` - Best for form fields
   - `getByPlaceholderText` - Input placeholders
   - `getByText` - Text content

2. **Semantic queries**:
   - `getByAltText` - Images with alt text
   - `getByTitle` - Elements with title

3. **Test IDs** (last resort):
   - `getByTestId` - Only when others don't work

```typescript
// ✅ GOOD: Accessible query
const button = screen.getByRole('button', { name: 'Submit' });

// ⚠️ OK: Text query
const button = screen.getByText('Submit');

// ❌ BAD: Test ID (less accessible)
const button = screen.getByTestId('submit-button');
```

---

### Mocking

#### **Mock Functions**

```typescript
import { vi } from 'vitest';

it('should call callback', () => {
  const callback = vi.fn();
  fireEvent.click(button);
  expect(callback).toHaveBeenCalledWith('expected-arg');
});
```

#### **Mock Modules**

```typescript
// Mock Supabase client
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { id: '123', name: 'Test' },
            error: null,
          })),
        })),
      })),
    })),
  },
}));
```

#### **Mock React Query**

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

// Usage:
it('should fetch data', () => {
  renderWithQuery(<MyComponent />);
  // ...
});
```

---

## 📈 Test Coverage

### Coverage Goals:

| Category | Target Coverage | Priority |
|----------|----------------|----------|
| **Critical Components** | 90%+ | P0 |
| **Forms & Validation** | 85%+ | P0 |
| **Custom Hooks** | 80%+ | P1 |
| **UI Components** | 70%+ | P1 |
| **Utility Functions** | 80%+ | P1 |
| **Admin Components** | 60%+ | P2 |

### Current Coverage (as of 2025-12-01):

```
✅ Button Component: 95% (17 tests)
✅ Badge Component: 88% (8 tests)
✅ Utils Library: 82% (12 tests)

⚠️ TODO: Add tests for:
- InspectionForm (critical)
- useAuth hook (critical)
- useIsAdmin hook (critical)
- AdminRoute component
- LocationForm
```

### Checking Coverage:

```bash
pnpm test:coverage

# View HTML report:
open coverage/index.html
```

---

## 🎯 Best Practices

### 1. **Arrange-Act-Assert (AAA) Pattern**

```typescript
it('should update count on button click', async () => {
  // ARRANGE: Setup test environment
  const user = userEvent.setup();
  render(<Counter initialCount={0} />);

  // ACT: Perform action
  await user.click(screen.getByRole('button', { name: 'Increment' }));

  // ASSERT: Verify outcome
  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});
```

---

### 2. **Test Behavior, Not Implementation**

```typescript
// ❌ BAD: Testing internal state
it('should set isLoading to true', () => {
  const { result } = renderHook(() => useData());
  expect(result.current.isLoading).toBe(true); // Internal detail
});

// ✅ GOOD: Testing user-visible behavior
it('should show loading spinner', () => {
  render(<DataComponent />);
  expect(screen.getByText('Loading...')).toBeInTheDocument();
});
```

---

### 3. **Avoid Testing Library Internals**

```typescript
// ❌ BAD: Testing React Query internals
it('should call useQuery with correct params', () => {
  const spy = vi.spyOn(ReactQuery, 'useQuery');
  render(<MyComponent />);
  expect(spy).toHaveBeenCalledWith(...);
});

// ✅ GOOD: Testing component behavior
it('should display fetched data', async () => {
  render(<MyComponent />);
  await waitFor(() => {
    expect(screen.getByText('Fetched Data')).toBeInTheDocument();
  });
});
```

---

### 4. **Keep Tests Fast**

```typescript
// ✅ GOOD: Fast unit tests (< 100ms each)
it('should format date', () => {
  expect(formatDate('2025-12-01')).toBe('December 1, 2025');
});

// ⚠️ AVOID: Slow integration tests (use sparingly)
it('should complete full inspection flow', async () => {
  // This takes 5+ seconds - minimize these
});
```

---

### 5. **Use Accessibility Queries**

```typescript
// ✅ GOOD: Semantic queries
const submitButton = screen.getByRole('button', { name: 'Submit' });
const emailInput = screen.getByLabelText('Email');

// ❌ BAD: Class/ID queries
const submitButton = container.querySelector('.submit-btn');
const emailInput = container.querySelector('#email-input');
```

---

## 🔄 CI/CD Integration

### GitHub Actions Example:

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run type check
        run: pnpm type-check

      - name: Run tests
        run: pnpm test:run

      - name: Generate coverage
        run: pnpm test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

### Pre-commit Hook:

```bash
# .husky/pre-commit
#!/bin/sh
pnpm type-check
pnpm test:run --changed
```

---

## 📚 Test Examples by Feature

### Authentication Flow:

```typescript
describe('Authentication', () => {
  it('should redirect unauthenticated users to login', () => {
    render(<ProtectedRoute><Dashboard /></ProtectedRoute>);
    expect(screen.getByText('Please log in')).toBeInTheDocument();
  });

  it('should allow authenticated users', () => {
    mockAuthUser({ id: '123', email: 'test@example.com' });
    render(<ProtectedRoute><Dashboard /></ProtectedRoute>);
    expect(screen.getByText('Welcome to Dashboard')).toBeInTheDocument();
  });
});
```

### Form Validation:

```typescript
describe('InspectionForm Validation', () => {
  it('should show error for empty cleanliness', async () => {
    const user = userEvent.setup();
    render(<InspectionForm />);

    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(screen.getByText('Cleanliness rating is required')).toBeInTheDocument();
  });

  it('should allow valid submission', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<InspectionForm onSubmit={onSubmit} />);

    await user.selectOptions(screen.getByLabelText('Cleanliness'), 'excellent');
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
  });
});
```

### API Integration:

```typescript
describe('useInspections Hook', () => {
  it('should fetch inspections', async () => {
    const mockData = [{ id: '1', status: 'completed' }];
    mockAPI('/api/inspections', { data: mockData });

    const { result } = renderHook(() => useInspections());

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData);
    });
  });

  it('should handle fetch errors', async () => {
    mockAPI('/api/inspections', { error: 'Network error' });

    const { result } = renderHook(() => useInspections());

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });
});
```

---

## 🐛 Debugging Tests

### Enable Debug Output:

```typescript
import { screen, render } from '@testing-library/react';

it('should render correctly', () => {
  render(<MyComponent />);

  // Print entire DOM
  screen.debug();

  // Print specific element
  screen.debug(screen.getByRole('button'));
});
```

### Vitest UI (Visual Debugging):

```bash
pnpm test:ui

# Opens http://localhost:51204/__vitest__/
# - View test results visually
# - See component snapshots
# - Filter and search tests
```

### Common Issues:

**Issue:** "Unable to find element with role..."
**Solution:** Use `screen.debug()` to see available elements

**Issue:** "Test timeout"
**Solution:** Increase timeout or use `waitFor` properly

```typescript
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
}, { timeout: 5000 });
```

---

## 📖 Further Reading

- [Vitest Docs](https://vitest.dev/)
- [React Testing Library Docs](https://testing-library.com/react)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Vitest UI](https://vitest.dev/guide/ui.html)

---

## 🎯 Testing Checklist for PRs

Before submitting a PR, ensure:

- [ ] All existing tests pass (`pnpm test:run`)
- [ ] New features have tests
- [ ] Critical components have 80%+ coverage
- [ ] No console errors/warnings in tests
- [ ] Tests follow naming conventions
- [ ] Accessible queries used (getByRole, getByLabelText)
- [ ] Type check passes (`pnpm type-check`)

---

**Questions?** Ask the team or check test examples in `/src/components/ui/Button.test.tsx`
