---
name: brew-guide
description: Use when the user wants to manage coffee beans, brewing notes, equipment, brewing methods, or related brew-guide records through the brew-guide CLI, including adding beans from images, recording brewing parameters, managing equipment and recipes, matching roaster names, and querying recent entries.
---

# Brew Guide Skill

通过 `brew-guide` CLI 管理咖啡豆、冲煮记录、器具和冲煮方案。

前置条件：先 `brew-guide init` 配置 Supabase 凭证，或用 `BREW_GUIDE_*` 环境变量。

## Core Principle

**NEVER create incomplete records.** 先收集足够信息，再写入。

## 渐进式披露（重要）

复杂操作的完整规则放在 `references/` 下。执行前按需读取，不要凭记忆。

| 要做的事 | 先读 |
|---|---|
| `bean add` 新增咖啡豆 | `references/bean-add.md` |
| `note add` 新增冲煮记录 | `references/note-add.md` |
| `method add` 新增冲煮方案 | `references/method-add.md` |

其他命令（list / get / update / delete / consume / equipment add 等）规则简单，直接按下表使用即可。

## CLI 命令总览

### init

```bash
brew-guide init
```

交互式配置 Supabase 凭证。

### bean — 咖啡豆

| 子命令 | 用途 | 示例 |
|---|---|---|
| `bean add` | 新增（见 `references/bean-add.md`） | `brew-guide bean add --name "..." --roaster "..." --origin "..." --process "..." [options] [--dry-run]` |
| `bean list` | 列出 | `brew-guide bean list [--limit N] [--format json]` |
| `bean get` | 详情 | `brew-guide bean get <id> [--format json]` |
| `bean update` | 更新 | `brew-guide bean update <id> --remaining "..." [--dry-run]` |
| `bean delete` | 软删除 | `brew-guide bean delete <id> [--dry-run]` |
| `bean consume` | 扣减余量 | `brew-guide bean consume <id> --amount 15 [--dry-run]` |

### note — 冲煮记录

| 子命令 | 用途 | 示例 |
|---|---|---|
| `note add` | 新增（见 `references/note-add.md`） | `brew-guide note add --bean-id "..." --method "..." [--equipment "V60"] [--rating 4] [--notes "..."] [--source tag] [--total-time 150] [legacy flat flags] [--dry-run]` |
| `note list` | 列出 | `brew-guide note list [--limit N] [--format json]` |
| `note get` | 详情 | `brew-guide note get <id> [--format json]` |
| `note update` | 更新 | `brew-guide note update <id> --rating 4 --notes "..." [--equipment "V60"] [--dry-run]`（`--rating` 0–5，接受 `3.5` 这类小数）|
| `note delete` | 软删除 | `brew-guide note delete <id> [--dry-run]` |

### equipment — 器具

| 子命令 | 用途 | 示例 |
|---|---|---|
| `equipment add` | 新增 | `brew-guide equipment add --name "V60" [--id "V60"] [--animation-type v60] [--has-valve] [--note "..."] [--dry-run]` |
| `equipment list` | 列出 | `brew-guide equipment list [--format json]` |
| `equipment get` | 详情 | `brew-guide equipment get <id> [--format json]` |
| `equipment update` | 更新 | `brew-guide equipment update <id> --name "..." --note "..." [--dry-run]` |
| `equipment delete` | 软删除 | `brew-guide equipment delete <id> [--dry-run]` |

`--animation-type` 可选：`v60 / kalita / origami / clever / custom / espresso`，默认 `custom`。

### method — 冲煮方案

| 子命令 | 用途 | 示例 |
|---|---|---|
| `method add` | 新增（见 `references/method-add.md`） | `brew-guide method add --equipment-id "..." --name "..." [options] [--dry-run]` |
| `method list` | 列出 | `brew-guide method list [--equipment-id "..."] [--format json]` |
| `method get` | 详情 | `brew-guide method get <id> [--format json]` |
| `method update` | 更新名称 | `brew-guide method update <id> --name "..." [--dry-run]` |
| `method delete` | **硬删除** | `brew-guide method delete <id> [--dry-run]` |

### roasters — 查烘焙商

```bash
brew-guide roasters [--format json]
```

### 通用 flags

- `--dry-run`：预览即将执行的操作，不实际写入
- `--format json`：以 JSON 格式输出

优先用 `--dry-run` 展示，用户确认后再正式执行。

## 查询约定

在新增 bean 或 note 前，如果需要查重、补上下文、确认 ID，先查最近记录：

```bash
brew-guide bean list --format json --limit 20
brew-guide note list --format json --limit 20
brew-guide equipment list --format json
brew-guide method list --format json
brew-guide roasters --format json
```

## 删除操作注意

- `bean / note / equipment` 的 delete 为**软删除**
- `method` 的 delete 为**硬删除**
- 执行任何 delete 前务必先 `--dry-run` 确认目标 ID
