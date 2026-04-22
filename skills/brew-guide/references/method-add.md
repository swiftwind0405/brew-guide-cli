# Method Add Workflow

新增冲煮方案的完整规则。执行 `brew-guide method add` 前阅读。

冲煮方案属于某个器具，新增前需要先知道 `equipment-id`。

## 1. 字段清单

**必填**
- `--equipment-id`
- `--name`

**推荐填写**
- `--coffee`（如 `20g`）
- `--water`（如 `300g`）
- `--ratio`（如 `1:15`）
- `--grind-size`（如 `Comandante 24 clicks`）
- `--temp`（如 `93`）
- `--stages-json`：分段注水步骤，见下文

## 2. 查 equipment-id

不确定时先查：

```bash
brew-guide equipment list --format json
```

## 3. stages-json Schema

必须是合法 JSON **数组**，每个元素是一个 stage：

```jsonc
[
  {
    "label": "闷蒸",           // 必填，步骤名
    "pourType": "center",      // 必填，注水方式
    "water": "60",             // 必填，本段水量（累计或单次，按项目约定）
    "duration": 30             // 必填，本段时长（秒）
  }
]
```

### pourType 可选值

- `center`：中心注水
- `circle`：绕圈注水
- `ice`：冰块
- `other`：其他/自定义

### 常见模式

**四六法（20g / 300g）**

```json
[
  {"label":"第一段 甜度","pourType":"center","water":"60","duration":10},
  {"label":"第一段 甜度","pourType":"circle","water":"120","duration":35},
  {"label":"第二段 酸质","pourType":"circle","water":"180","duration":20},
  {"label":"第三段 强度","pourType":"circle","water":"240","duration":20},
  {"label":"第四段 强度","pourType":"circle","water":"300","duration":20}
]
```

**V60 三段式**

```json
[
  {"label":"闷蒸","pourType":"center","water":"30","duration":30},
  {"label":"第二注","pourType":"circle","water":"150","duration":30},
  {"label":"第三注","pourType":"circle","water":"225","duration":30}
]
```

## 4. 先 dry-run

```bash
brew-guide method add \
  --equipment-id "equip_xxx" \
  --name "四六法" \
  --coffee "20g" \
  --water "300g" \
  --ratio "1:15" \
  --grind-size "Comandante 24 clicks" \
  --temp "93" \
  --stages-json '[{"label":"闷蒸","pourType":"center","water":"60","duration":30},{"label":"第二注","pourType":"circle","water":"60","duration":15}]' \
  --dry-run
```

## 5. 查询与管理

```bash
brew-guide method list --format json
brew-guide method list --equipment-id "equip_xxx" --format json
brew-guide method get <id> --format json
brew-guide method update <id> --name "改良四六法" --dry-run
brew-guide method delete <id> --dry-run
```

> `method delete` 是**硬删除**，执行前务必 dry-run 确认 ID。

## Anti-Patterns

- ❌ 不要不关联 `equipment-id` 就新增方案
- ❌ 不要跳过 dry-run
- ❌ `--stages-json` 必须是合法 JSON 数组，各 stage 必须包含 `label / pourType / water / duration`
- ❌ 不要在 `pourType` 里写中文或自定义字符串，只用枚举值
