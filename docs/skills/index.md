# Agent Skills

Virentia ships a set of **Agent Skills** — `SKILL.md` guidance files that teach an AI coding assistant (Claude Code, Cursor, Codex, and others) how to write idiomatic Virentia code. Each skill is a folder with a `SKILL.md` (a `name`/`description` frontmatter plus a guidance body) in the standard [Agent Skills](https://agentskills.io) format.

Source: [github.com/virentia-labs/skills](https://github.com/virentia-labs/skills)

The assistant loads every skill's `name` + `description` up front; the full body loads only when a skill matches the task. So you can install all of them and pay the context cost only for the ones you actually use.

## What's inside

| Skill | Use it for |
|-------|-----------|
| `virentia` | **Start here.** The mental model + `@virentia/core` API (stores, events, effects, reactions, scopes, owners, transactions, lazy models). Every other skill builds on it. |
| `virentia-react` | Rendering models in React (`ScopeProvider`, `useUnit`, `useModel`, `component`, caches). |
| `virentia-vue` | Rendering models in Vue 3 (mirrors React; stores come back as refs). |
| `virentia-forms` | `@virentia/forms` — fields, forms, validation, error channels, wizards, zod adapters, React hooks. |
| `virentia-router` | `@virentia/router` — routes, history, navigation, query tracking, React/RN views; argon-router migration. |
| `virentia-net` | `@virentia/net-core` — remote-data layer: `query`/`mutation` as effects, `trigger`, concurrency/retry operators, optimistic updates, invalidation. |
| `virentia-storage` | `@virentia/storage-core` — persist stores into boxes (local, session, query, memory, custom) with two-way sync. |
| `virentia-effector` | `@virentia/effector` — bridge real Effector units (`associate`, `fool`). |
| `virentia-inspector` | `@virentia/inspector` — devtools bridge, `connectEffector`, unit naming. |

`virentia` is foundational — the package skills assume that mental model and only cover their own surface. At minimum install `virentia`; add the package skills for the parts of the stack you use.

## Install

The skills are published to the [skills.sh](https://www.skills.sh) registry and connected with the [`skills`](https://github.com/vercel-labs/skills) CLI — the "npm for agent skills." It auto-detects your coding agent and drops the skill files where that agent looks for them. No global install needed; run it with `npx`.

Install everything:

```sh
npx skills add virentia-labs/skills --skill '*'
```

Just the core skill (start here):

```sh
npx skills add virentia-labs/skills --skill virentia
```

Pick only what you need:

```sh
npx skills add virentia-labs/skills \
  --skill virentia \
  --skill virentia-react \
  --skill virentia-forms
```

### Scope: project vs. global

By default skills install into the **current project** (`./.claude/skills/` for Claude Code), so you can commit them and share with your team. Add `-g` to install **globally** for every project on your machine (`~/.claude/skills/`):

```sh
npx skills add virentia-labs/skills --skill '*' -g
```

### Choose the agent

The CLI installs to whatever agents it detects; if none are found it prompts you to pick. Target one (or several) explicitly with `-a`:

```sh
npx skills add virentia-labs/skills --skill '*' -a claude-code
```

`skills` supports `claude-code`, `cursor`, `codex`, `opencode`, `gemini-cli`, and 60+ other agents.

### Manage installed skills

```sh
npx skills list      # what's installed
npx skills remove    # remove interactively
```

## How skills are invoked

- **Automatically.** The assistant reads each skill's `description` and pulls one in when your task matches — e.g. asking it to build a form activates `virentia-forms`.
- **Manually.** Invoke a skill by its name as a slash command: `/virentia`, `/virentia-react`, `/virentia-forms`, and so on.

In Claude Code, skills are auto-discovered on startup. After installing new ones, start a fresh session or run `/reload-plugins`, then confirm with `/virentia` — if the slash command exists, the skill is connected.

::: tip
Start with `virentia` and add package skills as you reach for each package. The names (`virentia`, `virentia-react`, …) are the skills' identity — the slash commands and the cross-references between skills rely on them.
:::
