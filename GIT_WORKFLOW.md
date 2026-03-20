# Git Workflow

## Branch Structure

```
main (production)
  ↑
staging (pre-production testing)
  ↑
dev (active development)
```

### Branch Purposes

- **`dev`** - Active development branch
  - All feature development happens here
  - Frequent commits as you build features
  - May be unstable at times

- **`staging`** - Pre-production testing
  - Code that's ready for final testing before production
  - Should be relatively stable
  - Used to verify features work in production-like environment

- **`main`** - Production branch
  - Only merge from staging after thorough testing
  - Should always be stable and deployable
  - Tagged with version numbers for releases

---

## Daily Development Workflow

### 1. Starting Work (on `dev`)

```bash
# Make sure you're on dev branch
git checkout dev

# Pull latest changes
git pull origin dev

# Create feature branch (optional, for larger features)
git checkout -b feature/interactive-voice-qa
```

### 2. Making Changes

```bash
# Make your code changes...

# Check what changed
git status
git diff

# Stage changes
git add <file>
# or add all changes
git add .

# Commit with descriptive message
git commit -m "Add InteractiveGuideButton component

- Implement voice recording with MediaRecorder
- Add Whisper transcription integration
- Connect to GPT-5.2 for contextual responses"
```

### 3. Pushing to `dev`

```bash
# If working on feature branch, merge to dev first
git checkout dev
git merge feature/interactive-voice-qa

# Push to remote dev
git push origin dev
```

---

## Promoting to Staging

When features are complete and ready for testing:

```bash
# Switch to staging
git checkout staging

# Merge dev into staging
git merge dev

# Push to remote staging
git push origin staging
```

**Test thoroughly on staging deployment before proceeding to production.**

---

## Deploying to Production

When staging tests pass and you're ready to deploy:

```bash
# Switch to main
git checkout main

# Merge staging into main
git merge staging

# Tag the release (optional but recommended)
git tag -a v1.2.0 -m "Release v1.2.0: Interactive Voice Q&A"

# Push to remote main
git push origin main

# Push tags
git push origin --tags
```

---

## Quick Reference Commands

### Check current branch
```bash
git branch
```

### View all branches (including remote)
```bash
git branch -a
```

### Switch branches
```bash
git checkout <branch-name>
```

### View commit history
```bash
git log --oneline --graph --all
```

### Undo last commit (keep changes)
```bash
git reset --soft HEAD~1
```

### Discard uncommitted changes
```bash
git restore <file>
# or discard all changes
git restore .
```

### View changes between branches
```bash
git diff dev..staging
git diff staging..main
```

---

## Emergency Hotfix Workflow

For critical production bugs that can't wait for normal dev cycle:

```bash
# Create hotfix branch from main
git checkout main
git checkout -b hotfix/critical-bug

# Make fix and test thoroughly
# ...

# Commit fix
git commit -m "Hotfix: Fix critical audio playback bug"

# Merge to main
git checkout main
git merge hotfix/critical-bug
git push origin main

# Also merge back to staging and dev
git checkout staging
git merge hotfix/critical-bug
git push origin staging

git checkout dev
git merge hotfix/critical-bug
git push origin dev

# Delete hotfix branch
git branch -d hotfix/critical-bug
```

---

## Best Practices

### Commit Messages

Follow this format:
```
<type>: <short summary>

<detailed description (optional)>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `refactor`: Code refactoring (no functional changes)
- `test`: Adding or updating tests
- `chore`: Maintenance tasks (dependencies, config)

**Examples:**
```bash
git commit -m "feat: Add voice Q&A to tour experience

- Implement InteractiveGuideButton component
- Integrate OpenAI Whisper for transcription
- Add GPT-5.2 contextual responses
- Stream ElevenLabs audio responses"
```

### When to Commit

- ✅ Commit frequently (every logical unit of work)
- ✅ Commit when tests pass
- ✅ Commit before switching tasks
- ❌ Don't commit broken code to `staging` or `main`
- ❌ Don't commit commented-out code or debug logs

### Before Pushing

Always run these checks:
```bash
# 1. Make sure code builds
npm run build

# 2. Run tests (when available)
npm test

# 3. Check for TypeScript errors
npm run type-check

# 4. Review what you're about to push
git log origin/dev..HEAD
git diff origin/dev
```

---

## Supabase Edge Functions Deployment

Edge Functions can be deployed independently of the main codebase:

```bash
# Deploy single function
cd supabase
supabase functions deploy <function-name>

# Deploy all functions
supabase functions deploy
```

**Best Practice:** Deploy Edge Functions to match your Git workflow:

```bash
# Development testing
# (make sure you're on dev branch)
git checkout dev
supabase functions deploy interactive-guide-conversation

# Staging verification
git checkout staging
# Test with staging environment variables

# Production deployment
git checkout main
supabase functions deploy interactive-guide-conversation
```

---

## Common Scenarios

### Scenario 1: Feature is half-done but need to switch tasks

```bash
# Save work in progress
git stash save "WIP: interactive voice component"

# Switch to other task
git checkout -b feature/other-task

# Later, come back
git checkout feature/interactive-voice
git stash pop
```

### Scenario 2: Accidentally committed to wrong branch

```bash
# If you committed to staging but meant dev:
git log  # note the commit hash

git checkout staging
git reset --hard HEAD~1  # undo commit on staging

git checkout dev
git cherry-pick <commit-hash>  # apply to dev
```

### Scenario 3: Need to sync dev with main changes

```bash
git checkout main
git pull origin main

git checkout dev
git merge main  # merge main into dev
git push origin dev
```

---

## Current Branch Status

- **`dev`**: Active development (you are here)
- **`staging`**: Ready for testing
- **`main`**: Production-ready

**Next Steps:**
1. Implement features on `dev`
2. Test locally
3. Push to `dev` remote
4. When ready, merge `dev` → `staging`
5. Test on staging deployment
6. Merge `staging` → `main` for production

---

**Last Updated:** December 30, 2025
**Status:** Active workflow for Edinburgh Whispers Route project
