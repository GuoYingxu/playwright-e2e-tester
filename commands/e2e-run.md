---
name: e2e-run
description: 运行 Playwright E2E 测试，生成 HTML 测试报告并输出测试结果摘要。
argument-hint: "[测试文件名称或标签过滤条件，支持 --headed / --debug 模式]"
---

# 运行 E2E 测试

执行已生成的 Playwright E2E 测试脚本，生成 HTML 测试报告，并展示测试结果摘要。

## 快速执行

解析 `$ARGUMENTS` 构建命令：

```
BASE_CMD = npx playwright test --config e2e/playwright.config.ts
```

| 参数 | 执行的命令 |
|------|-----------|
| 无参数 | `{BASE_CMD}` |
| `--headed` | `{BASE_CMD} --headed` |
| `--debug` | `{BASE_CMD} --debug` |
| `<文件名>` | `{BASE_CMD} e2e/tests/*<文件名>*.spec.ts` |
| `<文件名> --headed` | `{BASE_CMD} --headed e2e/tests/*<文件名>*.spec.ts` |

**判断逻辑**：扫描 `$ARGUMENTS`，如果包含 `--headed` 则在命令末尾追加 `--headed`；如果包含 `--debug` 则追加 `--debug`；剩余非标志参数作为文件名过滤条件。

## 执行前检查

1. 检查 `e2e/tests/` 目录是否存在 `.spec.ts` 文件。如果没有，提示先使用 `/e2e-generate`
2. 确认被测试应用正在运行（设置 `BASE_URL` 环境变量）

## 处理后输出

测试完成后，输出以下格式的摘要：

```
✅ 测试执行完毕！

📊 测试结果:
  ├── 总测试数: N
  ├── ✅ 通过: N
  ├── ❌ 失败: N
  └── ⏭️  跳过: N

❌ 失败测试:
  - "测试名称" → 错误摘要

📁 HTML 报告: e2e/reports/index.html
💡 使用 `npx playwright show-report e2e/reports` 查看详细报告
```

## 注意事项

- `workers: 1` — 测试文件之间顺序执行
- `serial` 模式 — 文件内部共用 Page，不反复创建销毁
- 登录由 `e2e/auth.setup.ts` 自动处理，通过 `TEST_USERNAME` / `TEST_PASSWORD` 环境变量配置

$ARGUMENTS
