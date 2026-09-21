# AGENTS.md

This file defines the maintenance principles and constraints for agents modifying this repository. It is not a project introduction or a setup guide.

## Principles

- `skills/` is the single source of truth for chart generation knowledge. All changes to chart usage, best practices, and constraints belong in skill documents, not scattered across code or other docs.
- Keep it simple. Prefer editing existing files; do not add new files or abstraction layers unless necessary.
- Keep code and docs in sync. When changing skill content or retrieval logic, update the affected indexes, tests, and docs in the same change.
- Write for retrieval quality. Skill frontmatter fields (`title`, `description`, `tags`, `use_cases`, `anti_patterns`) are retrieval fields — write them so the skill can be found accurately, not just read by humans.

## Constraints

- After modifying skill documents under `src/content/`, rebuild the index (`pnpm build:index`) and run tests (`pnpm test`).
- Do not introduce new runtime dependencies unless strictly necessary; prefer existing dependencies (`@antv/context`, `commander`, `gray-matter`).
- Do not change the zvec index field structure or embedding dimension (512d) unless the build script, retriever, and all tests are updated accordingly.
- Write commit messages in English.

## Keeping Docs and Config in Sync

Whenever a skill is added, modified, or removed under `skills/`, keep the following in sync in the same change:

### 1. `README.md` — "Available Skills" section

- Every skill directory under `skills/` must be listed under `## Available Skills`.
- Each entry must include an emoji icon, the skill name in bold (matching the directory name), a one-line description matching the skill's `SKILL.md` frontmatter `description`, and a short paragraph elaborating on its capabilities.
- Add entries for new skills, update entries for changed skills, and remove entries for deleted skills. Preserve the section's existing formatting style.

### 2. `.claude-plugin/marketplace.json` — `plugins` array

- Every skill directory under `skills/` must have a corresponding entry in the `plugins` array, in this format:

```json
{
  "name": "skill-name",
  "description": "Description from SKILL.md frontmatter.",
  "source": "./",
  "strict": false,
  "skills": ["./skills/skill-name"]
}
```

- Add entries for new skills, update `description` for changed skills, and remove entries for deleted skills. Keep the JSON valid.

### Checklist after any skill-related change

- [ ] All skill directories in `skills/` are listed in `README.md` under `## Available Skills`
- [ ] All skill descriptions in `README.md` match the corresponding `SKILL.md` frontmatter
- [ ] All skill directories in `skills/` have a corresponding entry in `.claude-plugin/marketplace.json`
- [ ] All `description` fields in `marketplace.json` match the corresponding `SKILL.md` frontmatter
- [ ] No stale entries exist in either `README.md` or `marketplace.json` for removed skills
- [ ] `marketplace.json` remains valid JSON after changes
