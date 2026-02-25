---
name: antv-skills-maintainer
description: Automatically sync documentation and configuration after any skill is added or updated. Triggers on every AI code execution to keep README Available Skills and .claude-plugin/marketplace.json up to date.
triggers:
  - always
---

# AntV Skills Maintainer

This skill ensures that all documentation and configuration files remain in sync whenever a skill is added or updated in this repository.

## Important

The `antv-skills-maintainer` skill is **internal-only** — it is used solely for this repository's iteration workflow. Do **not** add it to `README.md` "Available Skills" or `.claude-plugin/marketplace.json`. Only user-facing skills should appear in those files.

## When to Apply

Apply this skill automatically after **every code change** — especially when:

- A new skill directory is added under `skills/`
- An existing skill's `SKILL.md` is modified (name, description, capabilities)
- A skill is removed or deprecated

## What to Keep in Sync

### 1. README.md — "Available Skills" Section

The `## Available Skills` section in `README.md` must list every skill under `skills/` with:

- An appropriate emoji icon
- The skill **name** (bold, matching the directory name)
- A one-line description matching the skill's `SKILL.md` frontmatter `description` field
- A short paragraph elaborating on the skill's capabilities

**Format:**

```markdown
- 🔧 **skill-name**: One-line description from SKILL.md frontmatter.

`Skill Display Name` elaboration paragraph...
```

**Steps:**

1. Scan `skills/` directory to list all available skills.
2. Read each skill's `SKILL.md` frontmatter (`name`, `description`).
3. Compare with the current `## Available Skills` section in `README.md`.
4. Add entries for new skills, update entries for changed skills, remove entries for deleted skills.
5. Preserve the section's existing formatting style.

### 2. `.claude-plugin/marketplace.json` — Plugins Array

The `plugins` array in `.claude-plugin/marketplace.json` must contain an entry for every skill under `skills/`.

**Entry format:**

```json
{
  "name": "skill-name",
  "description": "Description from SKILL.md frontmatter.",
  "source": "./",
  "strict": false,
  "skills": [
    "./skills/skill-name"
  ]
}
```

**Steps:**

1. Scan `skills/` directory to list all available skills.
2. Read each skill's `SKILL.md` frontmatter (`name`, `description`).
3. Compare with the current `plugins` array in `.claude-plugin/marketplace.json`.
4. Add entries for new skills, update `description` for changed skills, remove entries for deleted skills.
5. Keep the JSON properly formatted and valid.

## Execution Checklist

After any skill-related code change, run through this checklist:

- [ ] All skill directories in `skills/` are listed in `README.md` under `## Available Skills`
- [ ] All skill descriptions in `README.md` match the corresponding `SKILL.md` frontmatter
- [ ] All skill directories in `skills/` have a corresponding entry in `.claude-plugin/marketplace.json`
- [ ] All `description` fields in `marketplace.json` match the corresponding `SKILL.md` frontmatter
- [ ] No stale entries exist in either `README.md` or `marketplace.json` for removed skills
- [ ] `marketplace.json` remains valid JSON after changes
