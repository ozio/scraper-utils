# AGENTS.md instructions for /Users/oz/Projects/scraper-utils

## User workflow preferences

- For this user, default to deploying without creating a new git branch.
- In solo workflows, prefer committing on the current branch and deploying directly unless the user explicitly asks for a separate branch or PR.
- If rollback is needed, prefer returning to an older commit instead of introducing branch-based workflow by default.

## API design taste

- Prefer helpers that read like a pleasant API, not a bag of positional arguments.
- When it improves readability, prefer an options object over long positional signatures.
- Inside options objects, prefer semantic labels like `to`, `from`, `at`, `in`, `with`, `as`, `for`, `using`, `overwrite`, `encoding`, `createDirectories`.
- Prefer wrappers and convenience entry points that call lower-level helpers if that makes call sites read like prose.
- Prefer tiny extra entities when they make the code feel obvious: small wrappers, aliases, adapters, and single-purpose helpers are welcome.
- Defaults should live in destructuring when possible so the happy path is visible immediately.
- Optimize for call sites that feel self-explanatory at a glance.
- Favor names and shapes that feel “Apple Swift” clean: small, direct, elegant, and a little indulgent about readability.
- Avoid stuttering APIs where the function name and the options object repeat the same preposition. Prefer `listFiles({ in })` over `listFilesIn({ in })`.

## Documentation taste

- Generate documentation for new helpers and notable APIs proactively when it adds clarity.
- Prefer short, beautiful docs over exhaustive dry docs.
- Good docs in this repo should show:
  - what the helper does in one sentence
  - the most readable call shape
  - one or two examples that feel nice to copy
  - any important defaults or side effects
- Prefer JSDoc for local API affordances and small markdown guides for broader style or patterns.
- When naming or shaping an API, include examples that make the intended taste obvious.
