---
name: brew-guide
description: Use when the user wants to manage coffee beans, brewing notes, or related brew-guide records through the brew-guide CLI, including adding beans from images, recording brewing parameters, matching roaster names, and querying recent entries.
---

# Brew Guide Skill

这些操作通过 `brew-guide` CLI 执行。确保已先运行 `brew-guide init` 配置好 Supabase 凭证，或者通过 `BREW_GUIDE_*` 环境变量提供凭证。

## Core Principle

**NEVER create incomplete records.** Always collect enough information before writing.

## CLI Usage

- 查询烘焙商：`brew-guide roasters --format json`
- 预览豆子写入：`brew-guide bean add ... --dry-run`
- 正式写入豆子：`brew-guide bean add ...`
- 预览冲煮记录写入：`brew-guide note add ... --dry-run`
- 正式写入冲煮记录：`brew-guide note add ...`
- 查询豆子：`brew-guide bean list [--limit N] [--format json]`
- 查询冲煮记录：`brew-guide note list [--limit N] [--format json]`

优先使用 `--dry-run` 展示即将写入的内容，再在用户确认后执行正式写入。

---

## Bean Workflow

### 1. 先收集这些信息

**必填**
- `name`
- `roaster`
- `origin`
- `process`

**推荐填写**
- `estate`
- `variety`
- `roastDate`
- `capacity`
- `beanType`

**可选**
- `roastLevel`
- `startDay`
- `endDay`
- `price`
- `flavor`
- `notes`

### 2. 烘焙商先匹配

如果识别出烘焙商，先跑：

```bash
brew-guide roasters --format json
```

匹配规则：
- 忽略大小写、空格和常见后缀
- 命中已有烘焙商时，用系统里的规范名字
- 没命中就保留原始名字

### 3. 给用户看提取结果

用自然语言展示，不要一上来像表单审讯。
先展示已有内容，再只补问关键缺失项。

示例：

```text
我识别到这些信息：
- 名称：秘鲁 美景庄园 SL-09 水洗
- 烘焙商：Finish Line Coffee
- 产地：秘鲁 卡哈马卡大区
- 庄园：VISTA ALEGRE
- 处理法：水洗
- 品种：SL-09
- 规格：150G
- 海拔：1920M

还缺：烘焙日期
```

### 4. 默认规则

- `beanType` 没给时，默认按 `filter`
- `beanType = filter` 且没给 `roastLevel` 时，默认 `浅度烘焙`
- `beanType = espresso` 且没给 `roastLevel` 时，默认 `中深烘焙`
- `startDay` / `endDay` 没给时，默认 `30 / 60`

### 5. 在途豆规则

- 如果豆子还没收到，可以直接新增
- 在途豆允许没有 `roastDate`
- 没有 `roastDate` 时，按在途豆处理
- agent 不要因为缺少 `roastDate` 就阻止创建
- 但仍要尽量收集 `name / roaster / origin / process`

在途豆示例：

```text
这包豆子还在路上，还没有烘焙日期。
这种情况可以直接建档，不用等收货后再录。
```

### 6. 烘焙度可选值

只使用这几个值：

- `极浅烘焙`
- `浅度烘焙`
- `中浅烘焙`
- `中度烘焙`
- `中深烘焙`
- `深度烘焙`

### 7. 备注怎么放

这些信息优先放进 `notes`：

- 海拔
- 批次
- 处理站
- 采收季
- 冲煮建议
- 其他包装说明

### 8. 先 dry-run，再正式写

示例：

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
  --notes "海拔：1920M" \
  --dry-run
```

用户确认后，再去掉 `--dry-run` 正式写入。

### Bean Anti-Patterns

❌ 不要只写名字和备注  
❌ 不要跳过 roaster matching  
❌ 不要跳过 dry-run  
❌ 不要缺少 `name / roaster / origin / process` 就直接提交  

---

## Brewing Notes Workflow

### 1. 收集这些字段

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

如果不知道 `beanId`，先查：

```bash
brew-guide bean list --format json --limit 20
```

### 2. 先给用户看草稿

用自然语言说明现在准备写什么，缺什么。

### 3. 先 dry-run

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

确认后再正式写入。

### Note Anti-Patterns

❌ 不要不关联 `beanId` 就直接记冲煮  
❌ 不要跳过 dry-run  
❌ 不要写出 0-100 之外的 `score`  

---

## Querying Records

常用查询：

- `brew-guide bean list`
- `brew-guide bean list --format json --limit 20`
- `brew-guide note list`
- `brew-guide note list --format json --limit 20`
- `brew-guide roasters --format json`

在新建 bean 或 note 前，如果需要查重、补上下文、确认 beanId，先查最近记录。
