# Агентские скиллы

Virentia поставляет набор **агентских скиллов (Agent Skills)** — файлов-инструкций `SKILL.md`, которые учат ИИ-ассистента (Claude Code, Cursor, Codex и другие) писать идиоматичный код на Virentia. Каждый скилл — это папка с файлом `SKILL.md` (frontmatter `name`/`description` плюс тело-инструкция) в стандартном формате [Agent Skills](https://agentskills.io).

Исходники: [github.com/virentia-labs/skills](https://github.com/virentia-labs/skills)

Ассистент заранее загружает у каждого скилла только `name` + `description`, а полное тело подтягивает лишь когда скилл подходит под задачу. Поэтому можно поставить все скиллы сразу и платить контекстом только за те, что реально используются.

## Что внутри

| Скилл | Для чего |
|-------|-----------|
| `virentia` | **Начните отсюда.** Ментальная модель + API `@virentia/core` (сторы, события, эффекты, реакции, скоупы, владельцы, транзакции, ленивые модели). На нём строятся все остальные. |
| `virentia-react` | Рендер моделей в React (`ScopeProvider`, `useUnit`, `useModel`, `component`, кеши). |
| `virentia-vue` | Рендер моделей в Vue 3 (зеркалит React; сторы возвращаются как `ref`). |
| `virentia-forms` | `@virentia/forms` — поля, формы, валидация, каналы ошибок, визарды, zod-адаптеры, React-хуки. |
| `virentia-router` | `@virentia/router` — роуты, history, навигация, отслеживание query, представления React/RN; миграция с argon-router. |
| `virentia-effector` | `@virentia/effector` — мост к настоящим юнитам Effector (`associate`, `fool`). |
| `virentia-inspector` | `@virentia/inspector` — мост к devtools, `connectEffector`, именование юнитов. |

`virentia` — фундаментальный: пакетные скиллы опираются на эту ментальную модель и покрывают только свою область. Как минимум поставьте `virentia`, а пакетные скиллы добавляйте под те части стека, что используете.

## Установка

Скиллы опубликованы в реестре [skills.sh](https://www.skills.sh) и подключаются через CLI [`skills`](https://github.com/vercel-labs/skills) — «npm для агентских скиллов». Он сам определяет ваш ИИ-агент и кладёт файлы туда, где агент их ищет. Глобально ставить не нужно — запускается через `npx`.

Поставить всё:

```sh
npx skills add virentia-labs/skills --skill '*'
```

Только базовый скилл (начните с него):

```sh
npx skills add virentia-labs/skills --skill virentia
```

Выбрать нужное:

```sh
npx skills add virentia-labs/skills \
  --skill virentia \
  --skill virentia-react \
  --skill virentia-forms
```

### Область: проект или глобально

По умолчанию скиллы ставятся в **текущий проект** (`./.claude/skills/` для Claude Code) — их можно закоммитить и расшарить на команду. Флаг `-g` ставит **глобально** для всех проектов на машине (`~/.claude/skills/`):

```sh
npx skills add virentia-labs/skills --skill '*' -g
```

### Выбор агента

CLI ставит скиллы во все обнаруженные агенты; если ни один не найден — предложит выбрать. Указать конкретный (или несколько) можно флагом `-a`:

```sh
npx skills add virentia-labs/skills --skill '*' -a claude-code
```

`skills` поддерживает `claude-code`, `cursor`, `codex`, `opencode`, `gemini-cli` и ещё 60+ агентов.

### Управление скиллами

```sh
npx skills list      # что установлено
npx skills remove    # удалить интерактивно
```

## Как вызываются скиллы

- **Автоматически.** Ассистент читает `description` каждого скилла и подтягивает подходящий под задачу — например, просьба собрать форму активирует `virentia-forms`.
- **Вручную.** Вызовите скилл по имени как слэш-команду: `/virentia`, `/virentia-react`, `/virentia-forms` и т. д.

В Claude Code скиллы обнаруживаются автоматически при старте. После установки новых начните новую сессию или выполните `/reload-plugins`, затем проверьте `/virentia` — если слэш-команда есть, скилл подключён.

::: tip
Начните с `virentia` и добавляйте пакетные скиллы по мере того, как беретесь за каждый пакет. Имена (`virentia`, `virentia-react`, …) — это идентичность скиллов: на них завязаны слэш-команды и перекрёстные ссылки между скиллами.
:::
