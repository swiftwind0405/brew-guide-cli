# Note Add Workflow

新增冲煮记录的完整规则。执行 `brew-guide note add` 前阅读。

## 1. 字段清单

- `--bean-id`（必填）
- `--method`（必填）
- `--grind-size`
- `--water-temp`
- `--ratio`
- `--brew-time`
- `--flavor`
- `--score`（0–100）
- `--memo`
- `--brewed-at`

## 2. 查 beanId

不知道 `beanId` 时先查：

```bash
brew-guide bean list --format json --limit 20
```

从结果中选中目标豆子的 `id`。

## 3. 先给用户看草稿

用自然语言说明现在准备写什么、缺什么，避免像表单审讯。

## 4. 先 dry-run

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

确认后再去掉 `--dry-run` 正式写入。

## 5. 扣减豆子余量

记完冲煮通常要顺手扣减对应豆子余量：

```bash
brew-guide bean consume <bean-id> --amount 15 --dry-run
```

## 6. 更新冲煮记录

支持更新 `--rating`（1–5）、`--method`、`--memo`：

```bash
brew-guide note update <id> --rating 4 --memo "回甘更好" --dry-run
```

## Anti-Patterns

- ❌ 不要不关联 `bean-id` 就直接记冲煮
- ❌ 不要跳过 dry-run
- ❌ `--score` 只能在 0–100 之间
- ❌ `--rating` 只能在 1–5 之间（仅 update 用）
