# Contributing to Enterprise Voice AI

We follow strict Agile/Scrum methodologies for all development. Please adhere to the following guidelines when contributing to the repository.

## Branching Strategy
We use GitFlow. 
- All new features must branch off `develop`.
- Branch names must include the Azure Boards ticket number (e.g., `feature/AB-123-websocket-fix`).
- Hotfixes branch directly from `main` and are merged back into both `main` and `develop`.

## Code Reviews
- All Pull Requests must have at least 1 approving review from a Senior Engineer before merging.
- CI/CD pipelines (Azure Pipelines) must pass. If PyTest or Vitest fails, the PR is automatically blocked.

## Commit Messages
Use conventional commits:
- `feat: add Twilio streaming support`
- `fix: resolve LLM router latency spike`
- `docs: update sprint 3 retrospective`
