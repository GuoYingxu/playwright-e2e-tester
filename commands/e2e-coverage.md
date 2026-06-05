---
name: e2e-coverage
description: 统计 E2E 测试覆盖率并写入 plan.md。两个维度：计划覆盖率（plan.md 中 ✅/❌ 状态）和路由覆盖率（已有测试文件 vs 项目路由）。纯静态分析，无需运行项目。
argument-hint: "[页面名称或路由路径，留空则统计所有页面]"
---

# E2E 测试覆盖率

统计 E2E 测试覆盖率并写入 `e2e/plan.md`。

## 两个维度

| 维度 | 说明 |
|------|------|
| **计划覆盖率** | 解析 plan.md 中 ✅/❌ 状态，统计已完成用例占比 |
| **路由覆盖率** | 扫描项目路由 vs `e2e/tests/*.spec.ts`，统计已覆盖路由占比 |

**纯静态分析，无需运行项目。**

支持参数过滤：`/e2e-coverage 登录` 只统计"登录"相关页面。

详见 skill 文档：`skills/e2e-coverage/SKILL.md`

$ARGUMENTS
