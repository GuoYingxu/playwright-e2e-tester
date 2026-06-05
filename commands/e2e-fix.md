---
name: e2e-fix
description: 修正已生成的 E2E 测试用例。读取现有 .spec.ts 文件，使用 MCP 浏览器重新分析页面，修复失效的选择器、断言或添加遗漏的步骤。
argument-hint: "[页面名称或路由路径，留空则列出所有可修正的测试文件]"
---

# 修正 E2E 测试用例

读取 `e2e/tests/` 下已生成的 `.spec.ts` 文件，通过 MCP 浏览器重新分析页面，修复失效的选择器、错误的断言，或根据页面变化调整测试步骤。

支持参数指定页面，留空则列出所有可修正的测试文件供选择。

详见 skill 文档：`skills/e2e-fix/SKILL.md`

$ARGUMENTS
