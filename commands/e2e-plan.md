---
name: e2e-plan
description: 分析项目前端代码和文档，生成 E2E 测试计划（Markdown 表格），列出测试用例名称并标记代码生成状态。纯静态分析，无需运行项目。plan 是 generate 的前置步骤。
argument-hint: "[页面名称或路由路径，留空扫描所有页面]"
---

# 生成 E2E 测试计划

分析前端代码和文档，生成测试用例名称清单，以 Markdown 表格形式输出到 `e2e/plan.md`。
**纯静态分析，无需运行项目。**

plan 文件会被 `/e2e-generate` 读取，按计划生成测试代码并更新状态。

## 快速执行步骤

### 1. 分析项目结构
- 读取 `package.json` 了解技术栈
- 扫描 `src/pages/`、`src/views/`、`src/router/`、`app/`、`pages/` 等目录识别页面和路由
- 读取路由配置文件理解 URL 路径与组件对应关系
- 如果指定了页面参数，只分析指定页面

### 2. 分析页面功能（静态代码分析）
- 读取页面组件源码，分析模板/JSX 中的交互元素
- 识别表单、按钮、列表、弹窗等关键组件
- 读取 API 相关代码和项目文档，理解功能逻辑
- 根据代码分析推断测试场景

### 3. 生成 plan.md
输出 Markdown 表格到 `e2e/plan.md`，包含页面列表和各页面的测试用例清单。

详见 skill 文档：`skills/e2e-plan/SKILL.md`

$ARGUMENTS
