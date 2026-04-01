---
name: brew-guide
description: Use when the user wants to manage coffee beans, brewing notes, or related brew-guide records through the brew-guide CLI, including adding beans from images, recording brewing parameters, matching roaster names, and querying recent entries.
---

# Brew Guide Skill

这些操作通过 `brew-guide` CLI 执行。确保已先运行 `brew-guide init` 配置好 Supabase 凭证，或者通过 `BREW_GUIDE_*` 环境变量提供凭证。

## Core Principle

**NEVER create incomplete records.** Always collect complete information before writing.

## CLI Usage

- 查询烘焙商：`brew-guide roasters --format json`
- 预览豆子写入：`brew-guide bean add ... --dry-run`
- 正式写入豆子：`brew-guide bean add ...`
- 预览冲煮记录写入：`brew-guide note add ... --dry-run`
- 正式写入冲煮记录：`brew-guide note add ...`
- 查询豆子：`brew-guide bean list [--limit N] [--format json]`
- 查询冲煮记录：`brew-guide note list [--limit N] [--format json]`

优先使用 `--dry-run` 向用户展示即将写入的结构，再在用户确认后执行正式写入。

## Available Tables

This workflow operates on four Supabase tables, but through the CLI rather than direct tool calls:

| Table | Description | Access Path |
|---|---|---|
| `coffee_beans` | 咖啡豆记录 | `brew-guide bean add`, `brew-guide bean list` |
| `brewing_notes` | 冲煮记录 | `brew-guide note add`, `brew-guide note list` |
| `custom_equipments` | 自定义器具 | 当前无专用写入命令 |
| `custom_methods` | 自定义冲煮方式 | 当前无专用写入命令 |

---

## Bean Entry Standard Workflow

When the user wants to add a coffee bean, especially from an image:

### Step 1: Extract from Image

Parse the packaging and extract all visible information:

- Name
- Roaster
- Origin / region
- Estate / farm
- Process
- Variety
- Roast level
- Altitude
- Capacity / weight
- Roast date
- Resting window start day
- Resting window end day
- Price
- Flavor notes
- Brewing suggestions

### Step 2: Match Roaster Name

If a roaster name is recognized or later provided by the user, run:

```bash
brew-guide roasters --format json
```

Then normalize and match:

- Ignore case, whitespace, and common suffixes such as `Coffee`, `Cafe`, `Roasters`, `Roastery`, `咖啡`
- If an existing roaster matches, use the canonical name already in the system
- If nothing matches, keep the original recognized or user-provided roaster name
- If the user later corrects the roaster, run the same matching step again

### Step 3: Display Extracted Info

Show the extracted fields clearly:

```text
从图片识别到以下信息：
- 名称：秘鲁 美景庄园 SL-09 水洗
- 烘焙商：Finish Line Coffee（已匹配系统记录）
- 产地：秘鲁 卡哈马卡大区
- 庄园：VISTA ALEGRE
- 处理法：水洗
- 品种：SL-09
- 规格：150G
- 海拔：1920M
- 风味：清晰花香、橙子、水果茶、柑橘酸质
```

### Step 4: Interactive Confirmation Loop

Keep the user in control:

```text
[目前缺少：烘焙日期、养豆起始天数、养豆结束天数、烘焙程度、价格、豆子类型]

请选择：
1. 补充某个字段
2. 直接提交
3. 删除某个字段
```

Loop until the user chooses to submit. If the roaster changes during the loop, run the roaster matching step again.

### Step 5: Dry-Run Preview

Before any write, preview the exact payload with `--dry-run`.

Example:

```bash
brew-guide bean add \
  --name "秘鲁 美景庄园 SL-09 水洗" \
  --roaster "Finish Line Coffee" \
  --origin "秘鲁 卡哈马卡大区" \
  --process "水洗" \
  --estate "VISTA ALEGRE" \
  --variety "SL-09" \
  --roast-level "浅度烘焙" \
  --roast-date "2026-03-20" \
  --price "55" \
  --capacity "150G" \
  --bean-type "filter" \
  --flavor "清晰花香,橙子,水果茶,柑橘酸质" \
  --start-day 30 \
  --end-day 60 \
  --notes "庄园：VISTA ALEGRE，海拔：1920M" \
  --dry-run
```

Show that preview output to the user.

### Step 6: Confirm and Write

Only after the user confirms, run the same command again without `--dry-run`.

```bash
brew-guide bean add \
  --name "秘鲁 美景庄园 SL-09 水洗" \
  --roaster "Finish Line Coffee" \
  --origin "秘鲁 卡哈马卡大区" \
  --process "水洗" \
  --estate "VISTA ALEGRE" \
  --variety "SL-09" \
  --roast-level "浅度烘焙" \
  --roast-date "2026-03-20" \
  --price "55" \
  --capacity "150G" \
  --bean-type "filter" \
  --flavor "清晰花香,橙子,水果茶,柑橘酸质" \
  --start-day 30 \
  --end-day 60 \
  --notes "庄园：VISTA ALEGRE，海拔：1920M"
```

## Complete Bean Data Structure

```json
{
  "name": "string (required)",
  "origin": "string",
  "roaster": "string",
  "process": "string",
  "estate": "string (written into blendComponents[].estate)",
  "variety": "string",
  "roastLevel": "string",
  "roastDate": "string (ISO date)",
  "startDay": "number",
  "endDay": "number",
  "price": "string",
  "capacity": "string",
  "beanType": "string",
  "flavor": ["array of flavor tags"],
  "notes": "string"
}
```

## Field Extraction Rules

- Always extract `capacity` when shown as weight or package size
- Always normalize `capacity` and `remaining` to numeric strings without units before writing, such as `100` instead of `100G`
- Always write estate/farm into `blendComponents[].estate` when available
- Always split flavor notes into an array before writing
- Always store `startDay` and `endDay` as numbers
- Default resting window to `30` and `60` when the user does not provide values
- Always normalize the roaster via `brew-guide roasters --format json` before final write
- Put extra packaging details such as altitude, lot, or region into `notes` if there is no dedicated CLI flag

## Bean Anti-Patterns

❌ **NEVER** save a record with only name and notes  
❌ **NEVER** skip roaster matching before final submission  
❌ **NEVER** bypass the dry-run preview step  
❌ **NEVER** submit without required fields `name`, `roaster`, `origin`, `process`  

---

## Brewing Notes Workflow

When the user wants to record a brewing session:

### Step 1: Collect Brewing Parameters

Collect or confirm:

- `beanId`
- `method`
- `grindSize`
- `waterTemp`
- `ratio`
- `brewTime`
- `flavor`
- `score`
- `memo`
- `brewedAt`

If the user does not know the bean ID, first inspect recent beans:

```bash
brew-guide bean list --format json --limit 20
```

### Step 2: Show Draft

Present the assembled note payload in natural language, highlighting missing core fields.

### Step 3: Dry-Run Preview

Preview the record before writing:

```bash
brew-guide note add \
  --bean-id "bean_xxx" \
  --method "V60" \
  --grind-size "Comandante 24 clicks" \
  --water-temp 92 \
  --ratio "1:15" \
  --brew-time "2:30" \
  --flavor "柑橘酸很明亮，花香明显" \
  --score 85 \
  --memo "后段更甜，下次可以再细一点" \
  --dry-run
```

Show the preview output to the user.

### Step 4: Confirm and Write

After confirmation, run the same command without `--dry-run`.

```bash
brew-guide note add \
  --bean-id "bean_xxx" \
  --method "V60" \
  --grind-size "Comandante 24 clicks" \
  --water-temp 92 \
  --ratio "1:15" \
  --brew-time "2:30" \
  --flavor "柑橘酸很明亮，花香明显" \
  --score 85 \
  --memo "后段更甜，下次可以再细一点"
```

## Complete Note Data Structure

```json
{
  "beanId": "string",
  "method": "string",
  "grindSize": "string",
  "waterTemp": "number",
  "ratio": "string",
  "brewTime": "string",
  "flavor": "string",
  "score": "number",
  "memo": "string",
  "brewedAt": "string"
}
```

## Note Anti-Patterns

❌ **NEVER** write a brewing note without trying to associate a `beanId`  
❌ **NEVER** skip the dry-run preview  
❌ **NEVER** save `score` outside 0-100  

---

## Querying Records

Use CLI queries for read operations:

- Recent beans:
  `brew-guide bean list`
- Recent beans as JSON:
  `brew-guide bean list --format json --limit 20`
- Recent notes:
  `brew-guide note list`
- Recent notes as JSON:
  `brew-guide note list --format json --limit 20`
- Roaster matching source:
  `brew-guide roasters --format json`

Before creating a new bean or note, query recent records when you need context, duplicate checks, or an existing bean ID.
