# Git Flow & PR System

## Overview
This document describes our branching model and pull request (PR) process. We keep the workflow simple: `main` is the 
single long-lived branch and serves as the staging area. Production releases are managed with annotated tags on commits in main.

## Branching model
- `main`
  - Single long-lived branch. Always reflect the latest staging-ready code.
  - Never force-push or directly commit to `main`.
  - This branch should be protected (require PRs, reviews, CI checks).
  - This branch should always be stable and bug free.

- Feature and fix branches
  - Create every working branch from `main`.
  - Naming convention: type/short-description
    - feature/<ticket>-short-desc
    - fix/<ticket>-short-desc
    - chore/<short-desc>
    - hotfix/<ticket>-short-desc (see hotfix policy)
  - Keep branches small and focused. If needed Rebase onto main regularly to minimize conflicts.

## Hotfixes
- Production fixes must be based on the production commit (tag). Create a hotfix branch from the release tag that represents production.
- After validation, merge the hotfix back into main and create a new production tag.

## Pull Request Process
### Creating a PR
- All changes must be merged into main via a PR.
- PR target: main branch.
- PR title should reference the ticket/issue ID and a short summary.
- PR description must include:
  - What the change does
  - Why it’s needed
  - How to test (manual steps or automated tests)
  - Links to related issues or design docs

### Review and approval
- At least one reviewer required for small changes, two for major changes (project maintainers may enforce stricter rules).
- Review checklist:
  - Code compiles and tests pass locally
  - Automated CI checks pass
  - No secrets or hard-coded credentials
  - Sufficient tests and/or test plan provided
  - Code follows style and architecture guidelines

### Merging
- Prefer using "Squash and merge" to keep main history concise and readable, unless a merge commit is explicitly preferred for a release branch.
- Before merging, ensure the PR is up-to-date with main (rebase or merge main into branch) and CI passes.
- Avoid force-pushing shared branches. Force-push only on feature branches when rewriting history locally and notify reviewers.

## Tags and Production Releases
- Production releases are created by tagging a commit on main with an annotated tag following semantic versioning: vMAJOR.MINOR.PATCH (for example, v1.2.3).
- Tagging steps:
  - Ensure main contains the exact code to release and that CI/artifacts are green.
  - Create an annotated tag: git tag -a v1.2.3 -m "Release v1.2.3"
  - Push the tag: git push origin v1.2.3
- Release artifacts, deployment jobs, or release notes should be produced based on the tag and CI pipeline.

## Changelog and Releases
- Maintain a changelog generated from PR titles and commit messages. Use the PR description to populate a release note when tagging.

## Notes and best practices
- Main is staging, not necessarily production. Do not assume code on main is already released; use tags to determine production versions.
- Keep PRs small to speed reviews.
- Use CI gates to enforce tests, linting, and security checks before merge.

This file is a concise policy; teams can extend with repository-specific rules and automation.
