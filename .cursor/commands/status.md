## /status Command

This command checks the current git status and summarizes the changes.

**Steps:**

1. Run `git status` to analyze repository changes.
2. Summarize which files have been modified, added, or deleted.
3. Output a clear summary for the user.

**Example Implementation (pseudo-code):**

```
- name: /status
  description: Check the git status and provide a summary.
  steps:
    - run: git status --short
    - summarize: >
        For each line, explain if the file was added, modified, deleted, or untracked.
        Group files by change type in the summary.
```

This rule helps to quickly understand the current state of your project files in version control.
