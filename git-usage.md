# Git Usage Guidelines

## Purpose

These guidelines describe how to use Git for day-to-day development: commit practices, message format, and small workflow rules to keep repositories clean and easy to understand.

## Commits

- Make small, focused, and atomic commits. Each commit should represent a single logical change.
- Commit often during local development to capture progress, but tidy history before merging to main (see PR guidance).
- Do not commit generated or build artifacts, secrets, or large binary files. Use .gitignore and LFS where appropriate.

## Commit Message Format

We follow a concise, conventional style for commit messages. This improves readability and makes changelogs easier to generate.

### Structure

1. Subject line (brief summary)
   - Format: `[type] (scope): brief summary`
   - **[type] is mandatory.** Always specify the type.
   - (scope) is optional but recommended to indicate the area of the code affected (e.g., auth, api, ui, docs).
   - Always keep it <= 50 characters.
   - Use the imperative mood: "Add", "Fix", "Update", not "Added" or "Fixes".
   - Do not end the subject line with a period.
2. Body (optional)
   - Explain what and why, not how.
   - Wrap lines at ~72 characters.
3. Footer (optional)
   - Use for referencing issues, breaking changes, or metadata.
   - Include links to ticket/issue IDs if applicable: "Refs: PROJ-123" or "Closes #456".

### Possible Types

Use one of the following types for every commit:

- **feat**:     A new feature
- **fix**:      A bug fix
- **docs**:     Documentation only changes
- **style**:    Changes that do not affect meaning of the code (white-space, formatting, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**:     A code change that improves performance
- **test**:     Adding or correcting tests
- **chore**:    Changes to the build process or auxiliary tools and libraries

### Examples
```
[feat] (payments): add retry logic for failed transactions

Add exponential backoff and max retries for transient errors.

Refs: PROJ-789
```

```
[fix] (profile): validate user input on profile update

Prevents 500 responses when request body is missing required fields.
```
### Additional Practices

- Use conventional commit types (mandatory): feat, fix, docs, style, refactor, perf, test, chore.
- Use `git add -p` to stage meaningful chunks.
- Avoid force-pushing shared branches. Force-push only on feature branches and only when necessary; notify reviewers.

## Commands Cheatsheet

- Use `-m` for commit messages:
  ```bash
  git commit -m "[type] (scope): brief summary"
  ```
- Use multiple `-m` flags for body and footer:
  ```bash
  git commit -m "[type] (scope): brief summary" -m "Detailed explanation of what and why." -m "Refs: PROJ-123"
  ```

**Keep commit messages clear, consistent, and focused. They are the primary history of why changes were made.**
