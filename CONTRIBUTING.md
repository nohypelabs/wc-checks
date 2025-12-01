# Contributing to WC-Checks

Thank you for considering contributing to WC-Checks! This document provides guidelines and best practices for contributing.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style Guidelines](#code-style-guidelines)
- [Commit Message Convention](#commit-message-convention)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)
- [Documentation Guidelines](#documentation-guidelines)

---

## 🤝 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors.

### Our Standards

**Examples of encouraged behavior:**
- ✅ Using welcoming and inclusive language
- ✅ Being respectful of differing viewpoints
- ✅ Gracefully accepting constructive criticism
- ✅ Focusing on what is best for the community
- ✅ Showing empathy towards other contributors

**Examples of unacceptable behavior:**
- ❌ Trolling, insulting/derogatory comments, and personal attacks
- ❌ Public or private harassment
- ❌ Publishing others' private information without permission
- ❌ Other conduct which could reasonably be considered inappropriate

### Enforcement

Violations of the Code of Conduct may result in temporary or permanent ban from the project.

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have:

```bash
✓ Node.js 20+ installed
✓ pnpm 8+ installed
✓ Git configured
✓ Vercel CLI installed (for API testing)
✓ Supabase account (for database access)
```

### Setting Up Development Environment

1. **Fork the Repository**
   ```bash
   # Click "Fork" button on GitHub
   ```

2. **Clone Your Fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/wc-checks.git
   cd wc-checks
   ```

3. **Add Upstream Remote**
   ```bash
   git remote add upstream https://github.com/ORIGINAL_REPO/wc-checks.git
   ```

4. **Install Dependencies**
   ```bash
   pnpm install
   ```

5. **Setup Environment Variables**
   ```bash
   cp .env.example .env.local
   # Fill in your Supabase and Cloudinary credentials
   ```

6. **Run Development Server**
   ```bash
   vercel dev  # With API routes
   # OR
   pnpm dev    # Frontend only
   ```

7. **Verify Setup**
   ```bash
   pnpm type-check  # Should pass with no errors
   pnpm test:run    # Should pass all tests
   ```

---

## 🔄 Development Workflow

### 1. **Create a Feature Branch**

```bash
# Update main branch
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes:
git checkout -b fix/bug-description
```

### 2. **Make Changes**

- Write code following our [style guidelines](#code-style-guidelines)
- Add tests for new features
- Update documentation if needed
- Commit frequently with clear messages

### 3. **Test Your Changes**

```bash
# Type check
pnpm type-check

# Run tests
pnpm test:run

# Run linter
pnpm lint

# Test locally
vercel dev  # Test API routes + frontend
```

### 4. **Keep Branch Updated**

```bash
# Regularly sync with upstream
git fetch upstream
git rebase upstream/main
```

### 5. **Push to Your Fork**

```bash
git push origin feature/your-feature-name
```

### 6. **Create Pull Request**

- Go to GitHub and create PR from your fork
- Fill in PR template completely
- Link related issues
- Request review from maintainers

---

## 🎨 Code Style Guidelines

### TypeScript

#### **1. Use Explicit Types**

```typescript
// ✅ GOOD
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export function Button({ onClick, children, variant = 'primary' }: ButtonProps) {
  // ...
}

// ❌ BAD
export function Button(props: any) {
  // No types, impossible to maintain
}
```

#### **2. Prefer Interfaces Over Types**

```typescript
// ✅ GOOD: Interface (extendable)
interface User {
  id: string;
  name: string;
}

interface Admin extends User {
  role: string;
}

// ⚠️ OK: Type alias (for unions)
type Status = 'pending' | 'active' | 'inactive';
```

#### **3. Use Descriptive Names**

```typescript
// ✅ GOOD
const isUserAuthenticated = true;
const fetchInspectionData = async () => {};
const totalInspectionCount = 42;

// ❌ BAD
const flag = true;
const getData = async () => {};
const num = 42;
```

---

### React Components

#### **1. Functional Components Only**

```typescript
// ✅ GOOD: Functional component
export function Dashboard() {
  const [data, setData] = useState<Data[]>([]);
  return <div>...</div>;
}

// ❌ BAD: Class component (we don't use these)
export class Dashboard extends React.Component {
  // ...
}
```

#### **2. Component Structure**

```typescript
// ✅ GOOD: Logical ordering
function MyComponent({ prop1, prop2 }: Props) {
  // 1. Hooks (top of component)
  const { user } = useAuth();
  const [state, setState] = useState();

  // 2. Derived state
  const isAdmin = checkAdmin(user);

  // 3. Effects
  useEffect(() => {
    // ...
  }, [dependencies]);

  // 4. Event handlers
  const handleClick = () => {
    // ...
  };

  // 5. Render helpers (if needed)
  const renderSection = () => {
    // ...
  };

  // 6. Return JSX
  return <div>...</div>;
}
```

#### **3. Component File Organization**

```typescript
// ComponentName.tsx

import { useState } from 'react';
// ... other imports

// Types/Interfaces (at top)
interface ComponentProps {
  // ...
}

// Component (default export at bottom)
export function ComponentName({ prop1, prop2 }: ComponentProps) {
  // ...
}

// Helper functions (after component, if any)
function helperFunction() {
  // ...
}
```

---

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| **Components** | PascalCase | `Button`, `UserDashboard` |
| **Functions** | camelCase | `fetchData`, `handleClick` |
| **Variables** | camelCase | `userData`, `isLoading` |
| **Constants** | UPPER_SNAKE_CASE | `API_URL`, `MAX_RETRIES` |
| **Interfaces** | PascalCase + Interface suffix | `ButtonProps`, `UserData` |
| **Types** | PascalCase | `Status`, `Role` |
| **Files** | PascalCase (components) or camelCase (utils) | `Button.tsx`, `utils.ts` |

---

### File Structure

```
src/
├── components/
│   └── ui/
│       ├── Button.tsx          # Component
│       ├── Button.test.tsx     # Tests (co-located)
│       └── index.ts            # Optional: re-exports
├── hooks/
│   ├── useAuth.ts              # Hook
│   ├── useAuth.test.ts         # Tests (co-located)
│   └── index.ts                # Optional: barrel export
└── lib/
    ├── utils.ts                # Utilities
    ├── utils.test.ts           # Tests (co-located)
    └── index.ts                # Optional: barrel export
```

---

## 📝 Commit Message Convention

We follow **Conventional Commits** format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type | Usage |
|------|-------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Code style (formatting, no logic change) |
| `refactor` | Code refactoring (no behavior change) |
| `perf` | Performance improvement |
| `test` | Add/update tests |
| `chore` | Build process, dependencies |
| `ci` | CI/CD changes |

### Examples

```bash
# Feature
feat(inspection): add photo upload compression

# Bug fix
fix(auth): resolve token expiration handling

# Documentation
docs(readme): update installation instructions

# Refactor
refactor(reports): simplify date filtering logic

# Performance
perf(dashboard): optimize query with indexes

# Test
test(button): add accessibility tests
```

### Rules

- ✅ Use present tense ("add" not "added")
- ✅ Use imperative mood ("fix" not "fixes")
- ✅ Don't capitalize first letter
- ✅ No period at the end
- ✅ Keep first line under 72 characters
- ✅ Reference issues in footer (`Fixes #123`)

---

## 🔀 Pull Request Process

### 1. **PR Title**

Follow commit message convention:

```
feat(inspection): add bulk photo upload
fix(dashboard): resolve mobile layout issue
docs(api): add endpoint documentation
```

### 2. **PR Description Template**

```markdown
## What does this PR do?

Brief description of changes (1-2 sentences)

## Type of Change

- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to change)
- [ ] Documentation update

## How Has This Been Tested?

- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] Tested on mobile devices
- [ ] Tested on different browsers

## Checklist

- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented complex code
- [ ] I have updated documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix/feature works
- [ ] All tests pass locally
- [ ] Type check passes
- [ ] Lint passes

## Screenshots (if applicable)

Before | After
------ | -----
![before](url) | ![after](url)

## Related Issues

Fixes #123
Closes #456
Related to #789
```

### 3. **Review Process**

1. **Automated Checks**:
   - ✅ All tests pass
   - ✅ Type check passes
   - ✅ Lint passes
   - ✅ Build succeeds

2. **Code Review**:
   - At least 1 approval required
   - Address all comments
   - Request re-review after changes

3. **Merge**:
   - Squash and merge (preferred)
   - Delete branch after merge

---

## 🧪 Testing Requirements

### Minimum Coverage

- **Critical Components**: 90%+ coverage
- **Forms**: 85%+ coverage
- **Hooks**: 80%+ coverage
- **UI Components**: 70%+ coverage

### Required Tests

For **new features**, include:
- ✅ Unit tests for components
- ✅ Unit tests for hooks
- ✅ Integration tests for forms
- ✅ Accessibility tests (ARIA, keyboard navigation)

For **bug fixes**, include:
- ✅ Regression test (prevents bug from coming back)

### Test Naming

```typescript
describe('ComponentName', () => {
  describe('Feature/Behavior', () => {
    it('should do something specific', () => {
      // Test implementation
    });
  });
});
```

### Running Tests

```bash
# All tests
pnpm test:run

# Specific file
pnpm test src/components/ui/Button.test.tsx

# Coverage report
pnpm test:coverage
```

---

## 📚 Documentation Guidelines

### Code Comments

```typescript
// ✅ GOOD: Explain WHY, not WHAT
// Calculate score based on weighted average because
// cleanliness has 2x impact on overall rating
const score = (cleanliness * 2 + supplies + maintenance) / 4;

// ❌ BAD: Obvious comment
// Add 1 to counter
counter = counter + 1;
```

### JSDoc for Public APIs

```typescript
/**
 * Fetches user inspections for a given date range
 *
 * @param userId - The ID of the user
 * @param startDate - Start date (inclusive)
 * @param endDate - End date (inclusive)
 * @returns Array of inspections
 *
 * @example
 * ```ts
 * const inspections = await fetchInspections(
 *   'user-123',
 *   new Date('2025-01-01'),
 *   new Date('2025-01-31')
 * );
 * ```
 */
export async function fetchInspections(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<Inspection[]> {
  // ...
}
```

### README Updates

If your PR changes:
- Installation steps → Update README.md
- API endpoints → Update BACKEND_API_COMPLETE.md
- Features → Update FEATURES_SUMMARY.md

---

## 🐛 Reporting Bugs

### Before Reporting

1. **Search existing issues** - Bug might already be reported
2. **Test on latest version** - Bug might already be fixed
3. **Reproduce consistently** - Can you make it happen every time?

### Bug Report Template

```markdown
## Bug Description

Clear, concise description of the bug

## Steps to Reproduce

1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior

What you expected to happen

## Actual Behavior

What actually happened

## Screenshots

If applicable, add screenshots

## Environment

- OS: [e.g., macOS 14.0]
- Browser: [e.g., Chrome 120]
- Device: [e.g., iPhone 14, Desktop]
- Version: [e.g., 3.0.0]

## Additional Context

Any other context about the problem
```

---

## 💡 Feature Requests

### Feature Request Template

```markdown
## Feature Description

Clear, concise description of the feature

## Problem It Solves

What problem does this solve?

## Proposed Solution

How would this feature work?

## Alternatives Considered

What other solutions did you consider?

## Additional Context

Mockups, examples, references
```

---

## ❓ Questions?

- **General Questions**: Slack #wc-checks-dev
- **Technical Questions**: GitHub Discussions
- **Security Issues**: Email security@yourcompany.com (DO NOT open public issue!)

---

## 🏆 Recognition

Contributors will be:
- Listed in CHANGELOG.md
- Mentioned in release notes
- Added to CONTRIBUTORS.md (coming soon)

Top contributors may receive:
- Swag (t-shirts, stickers)
- Special Discord role
- Early access to new features

---

## 📜 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

**Thank you for contributing to WC-Checks! 🙏**

*Every contribution, no matter how small, makes a difference.*
