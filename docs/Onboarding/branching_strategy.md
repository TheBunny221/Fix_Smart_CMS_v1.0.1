# Branching Strategy

This document outlines our Git workflow, branching conventions, and pull request submission rules to ensure consistent and efficient collaboration across the development team.

## Git Flow Overview

We follow a modified Git Flow strategy that balances simplicity with the need for stable releases and parallel development.

### Branch Types

```mermaid
gitgraph
    commit id: "Initial"
    branch develop
    checkout develop
    commit id: "Dev setup"
    
    branch feature/user-auth
    checkout feature/user-auth
    commit id: "Add login"
    commit id: "Add logout"
    
    checkout develop
    merge feature/user-auth
    commit id: "Merge auth"
    
    branch release/v1.0
    checkout release/v1.0
    commit id: "Version bump"
    commit id: "Bug fixes"
    
    checkout main
    merge release/v1.0
    commit id: "Release v1.0"
    
    checkout develop
    merge release/v1.0
    
    branch hotfix/critical-bug
    checkout hotfix/critical-bug
    commit id: "Fix critical bug"
    
    checkout main
    merge hotfix/critical-bug
    commit id: "Hotfix v1.0.1"
    
    checkout develop
    merge hotfix/critical-bug
```

## Branch Structure

### Main Branches

#### `main`
- **Purpose**: Production-ready code
- **Protection**: Protected branch, no direct commits
- **Deployment**: Automatically deployed to production
- **Merges from**: `release/*`, `hotfix/*`

#### `develop`
- **Purpose**: Integration branch for features
- **Protection**: Protected branch, requires PR approval
- **Deployment**: Automatically deployed to staging
- **Merges from**: `feature/*`, `bugfix/*`, `release/*`, `hotfix/*`

### Supporting Branches

#### `feature/*`
- **Purpose**: New feature development
- **Naming**: `feature/feature-name` or `feature/ticket-number-description`
- **Base**: `develop`
- **Merge to**: `develop`
- **Lifetime**: Until feature is complete

Examples:
- `feature/user-authentication`
- `feature/complaint-dashboard`
- `feature/JIRA-123-email-notifications`

#### `bugfix/*`
- **Purpose**: Non-critical bug fixes
- **Naming**: `bugfix/bug-description` or `bugfix/ticket-number-description`
- **Base**: `develop`
- **Merge to**: `develop`
- **Lifetime**: Until bug is fixed

Examples:
- `bugfix/login-validation-error`
- `bugfix/JIRA-456-dashboard-loading-issue`

#### `release/*`
- **Purpose**: Prepare new production release
- **Naming**: `release/version-number`
- **Base**: `develop`
- **Merge to**: `main` and `develop`
- **Lifetime**: Until release is deployed

Examples:
- `release/v1.0.0`
- `release/v1.2.3`

#### `hotfix/*`
- **Purpose**: Critical production bug fixes
- **Naming**: `hotfix/critical-issue-description`
- **Base**: `main`
- **Merge to**: `main` and `develop`
- **Lifetime**: Until hotfix is deployed

Examples:
- `hotfix/security-vulnerability`
- `hotfix/database-connection-issue`

## Branching Conventions

### Branch Naming Rules

#### Format
```
<type>/<description>
```

#### Types
- `feature/` - New features
- `bugfix/` - Bug fixes
- `hotfix/` - Critical production fixes
- `release/` - Release preparation
- `chore/` - Maintenance tasks
- `docs/` - Documentation updates

#### Description Guidelines
- Use lowercase with hyphens
- Be descriptive but concise
- Include ticket number if applicable
- Avoid special characters

#### Valid Examples
```bash
feature/user-profile-management
bugfix/email-validation-error
hotfix/payment-gateway-timeout
release/v2.1.0
chore/update-dependencies
docs/api-documentation-update
feature/JIRA-789-complaint-filtering
```

#### Invalid Examples
```bash
feature/UserProfile          # Use lowercase with hyphens
bugfix/fix_bug               # Use hyphens, not underscores
feature/new feature          # No spaces
hotfix/URGENT!!!             # No special characters
```

### Commit Message Conventions

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

#### Format
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

#### Examples
```bash
feat(auth): add user login functionality

fix(dashboard): resolve complaint loading issue

docs(api): update authentication endpoints

style(components): format button component

refactor(services): extract complaint validation logic

test(auth): add login integration tests

chore(deps): update React to v18.2.0
```

#### Detailed Commit Message
```bash
feat(complaints): add complaint filtering by category

- Add category filter dropdown to complaints list
- Implement backend filtering logic
- Update API documentation
- Add unit tests for filter functionality

Closes #123
```

## Workflow Procedures

### Feature Development Workflow

#### 1. Start New Feature
```bash
# Ensure you're on develop and up to date
git checkout develop
git pull origin develop

# Create and checkout feature branch
git checkout -b feature/complaint-dashboard

# Push branch to remote
git push -u origin feature/complaint-dashboard
```

#### 2. Development Process
```bash
# Make changes and commit regularly
git add .
git commit -m "feat(dashboard): add complaint list component"

# Push changes regularly
git push origin feature/complaint-dashboard

# Keep branch updated with develop
git checkout develop
git pull origin develop
git checkout feature/complaint-dashboard
git merge develop
```

#### 3. Complete Feature
```bash
# Final commit and push
git add .
git commit -m "feat(dashboard): complete complaint dashboard implementation"
git push origin feature/complaint-dashboard

# Create pull request (see PR guidelines below)
```

### Bug Fix Workflow

#### 1. Start Bug Fix
```bash
# Create bugfix branch from develop
git checkout develop
git pull origin develop
git checkout -b bugfix/login-validation-error
```

#### 2. Fix and Test
```bash
# Implement fix
git add .
git commit -m "fix(auth): resolve email validation error"

# Test thoroughly
npm test
npm run e2e

# Push changes
git push origin bugfix/login-validation-error
```

### Hotfix Workflow

#### 1. Start Hotfix
```bash
# Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/security-vulnerability
```

#### 2. Implement Fix
```bash
# Make critical fix
git add .
git commit -m "fix(security): patch authentication vulnerability"

# Test fix
npm test
```

#### 3. Deploy Hotfix
```bash
# Push hotfix
git push origin hotfix/security-vulnerability

# Create PR to main (expedited review)
# After merge, create PR to develop
```

### Release Workflow

#### 1. Prepare Release
```bash
# Create release branch from develop
git checkout develop
git pull origin develop
git checkout -b release/v1.2.0
```

#### 2. Release Preparation
```bash
# Update version numbers
npm version 1.2.0

# Update changelog
# Update documentation
# Final testing

git add .
git commit -m "chore(release): prepare v1.2.0 release"
git push origin release/v1.2.0
```

#### 3. Complete Release
```bash
# Create PR to main
# After merge and deployment, merge back to develop
```

## Pull Request Guidelines

### PR Creation Checklist

#### Before Creating PR
- [ ] Branch is up to date with target branch
- [ ] All tests pass locally
- [ ] Code follows style guidelines
- [ ] Documentation is updated
- [ ] Commit messages follow conventions

#### PR Title Format
```
<type>(<scope>): <description>
```

Examples:
- `feat(auth): add user registration functionality`
- `fix(dashboard): resolve complaint loading issue`
- `docs(api): update authentication endpoints`

#### PR Description Template
```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] E2E tests pass (if applicable)

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes

## Related Issues
Closes #123
Fixes #456
```

### Code Review Process

#### Review Requirements
- **Feature PRs**: Minimum 2 approvals
- **Bug fixes**: Minimum 1 approval
- **Hotfixes**: Expedited review, minimum 1 approval
- **Documentation**: Minimum 1 approval

#### Review Guidelines

##### For Authors
- Keep PRs focused and reasonably sized
- Provide clear description and context
- Respond to feedback promptly
- Update PR based on review comments
- Ensure CI/CD checks pass

##### For Reviewers
- Review within 24 hours (business days)
- Provide constructive feedback
- Test changes locally if needed
- Check for code quality and standards
- Verify tests and documentation

#### Review Checklist
- [ ] Code quality and readability
- [ ] Adherence to coding standards
- [ ] Test coverage and quality
- [ ] Documentation updates
- [ ] Security considerations
- [ ] Performance implications
- [ ] Breaking changes identified

### Merge Strategies

#### Merge Types
- **Squash and Merge**: Default for feature branches
- **Merge Commit**: For release and hotfix branches
- **Rebase and Merge**: For small, clean commits

#### When to Use Each
- **Squash and Merge**: 
  - Feature branches with multiple commits
  - Keeps main/develop history clean
  - Default choice for most PRs

- **Merge Commit**:
  - Release branches
  - Hotfix branches
  - Preserves branch history

- **Rebase and Merge**:
  - Single commit changes
  - Documentation updates
  - Small bug fixes

## Branch Protection Rules

### Main Branch Protection
- Require pull request reviews (2 approvals)
- Dismiss stale reviews when new commits are pushed
- Require status checks to pass
- Require branches to be up to date
- Restrict pushes to administrators only
- Allow force pushes: No
- Allow deletions: No

### Develop Branch Protection
- Require pull request reviews (1 approval)
- Require status checks to pass
- Require branches to be up to date
- Allow force pushes: No
- Allow deletions: No

## Continuous Integration

### Automated Checks
All PRs must pass these checks:

#### Code Quality
- ESLint checks
- Prettier formatting
- TypeScript compilation
- Import/export validation

#### Testing
- Unit tests (minimum 80% coverage)
- Integration tests
- E2E tests (for UI changes)
- API tests (for backend changes)

#### Security
- Dependency vulnerability scan
- Code security analysis
- Secret detection

#### Build
- Frontend build success
- Backend build success
- Docker image build (if applicable)

### Status Checks Configuration
```yaml
# .github/workflows/pr-checks.yml
name: PR Checks
on:
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run linting
        run: npm run lint
      
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
```

## Git Hooks

### Pre-commit Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix",
      "prettier --write",
      "git add"
    ],
    "*.{md,json}": [
      "prettier --write",
      "git add"
    ]
  }
}
```

### Commit Message Validation
```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore']
    ],
    'subject-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 100]
  }
};
```

## Common Scenarios

### Scenario 1: Feature Development
```bash
# Start feature
git checkout develop
git pull origin develop
git checkout -b feature/user-notifications

# Develop feature
# ... make changes ...
git add .
git commit -m "feat(notifications): add email notification system"

# Keep updated
git checkout develop
git pull origin develop
git checkout feature/user-notifications
git rebase develop

# Complete feature
git push origin feature/user-notifications
# Create PR to develop
```

### Scenario 2: Emergency Hotfix
```bash
# Start hotfix
git checkout main
git pull origin main
git checkout -b hotfix/critical-security-fix

# Implement fix
# ... make changes ...
git add .
git commit -m "fix(security): patch critical vulnerability"

# Deploy hotfix
git push origin hotfix/critical-security-fix
# Create PR to main (expedited)
# After merge, create PR to develop
```

### Scenario 3: Merge Conflicts
```bash
# Update your branch
git checkout develop
git pull origin develop
git checkout feature/my-feature
git merge develop

# Resolve conflicts
# ... edit conflicted files ...
git add .
git commit -m "resolve merge conflicts with develop"

# Continue development
```

### Scenario 4: Rollback Changes
```bash
# Rollback last commit (not pushed)
git reset --soft HEAD~1

# Rollback pushed changes
git revert <commit-hash>
git push origin feature/my-feature
```

## Best Practices

### Branch Management
- Keep branches focused on single features/fixes
- Delete branches after merging
- Regularly sync with develop/main
- Use descriptive branch names
- Avoid long-lived feature branches

### Commit Practices
- Make atomic commits
- Write clear commit messages
- Commit frequently
- Don't commit broken code
- Use conventional commit format

### Collaboration
- Communicate about large changes
- Review PRs promptly
- Provide constructive feedback
- Keep PRs reasonably sized
- Update documentation

### Code Quality
- Follow coding standards
- Write tests for new features
- Maintain test coverage
- Update documentation
- Consider performance impact

## Troubleshooting

### Common Issues

#### Merge Conflicts
```bash
# Resolve conflicts manually
git status
# Edit conflicted files
git add .
git commit -m "resolve merge conflicts"
```

#### Accidentally Committed to Wrong Branch
```bash
# Move commits to correct branch
git log --oneline -n 5  # Find commit hash
git checkout correct-branch
git cherry-pick <commit-hash>
git checkout wrong-branch
git reset --hard HEAD~1  # Remove from wrong branch
```

#### Need to Update PR After Review
```bash
# Make changes based on review
git add .
git commit -m "address review feedback"
git push origin feature/my-feature
# PR will automatically update
```

#### Squash Commits Before Merge
```bash
# Interactive rebase to squash commits
git rebase -i HEAD~3  # Squash last 3 commits
# Change 'pick' to 'squash' for commits to combine
git push --force-with-lease origin feature/my-feature
```

## Tools and Automation

### Recommended Git Tools
- **Git GUI**: GitKraken, SourceTree, or VS Code Git integration
- **Command Line**: Git CLI with aliases
- **Merge Tools**: VS Code, Beyond Compare, or KDiff3

### Git Aliases
```bash
# Useful Git aliases
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
git config --global alias.unstage 'reset HEAD --'
git config --global alias.last 'log -1 HEAD'
git config --global alias.visual '!gitk'
git config --global alias.graph 'log --oneline --graph --decorate --all'
```

### VS Code Git Integration
- Use built-in Git features
- Install Git Graph extension
- Configure Git Lens for enhanced Git capabilities
- Use integrated terminal for Git commands

## See Also

- [Local Setup](./local_setup.md) - Development environment setup
- [Development Tools](./development_tools.md) - Recommended tools and extensions
- [Debugging Tips](./debugging_tips.md) - Troubleshooting and debugging guide
- [Code Guidelines](../Developer/code_guidelines.md) - Coding standards and practices
- [QA Test Cases](../QA/test_cases.md) - Testing procedures and validation