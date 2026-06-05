---
name: e2e-generate
description: 根据 e2e/plan.md 测试计划生成 Playwright E2E 测试脚本。计划由 /e2e-plan 先生成。支持参数指定页面/模块。
argument-hint: "[页面名称或路由路径，留空则按计划生成所有未完成的用例]"
---

# 生成 E2E 测试代码

根据 `e2e/plan.md` 测试计划，逐个页面生成 Playwright E2E 测试脚本。所有测试共用同一个 Page 实例，顺序连续执行，不反复打开关闭浏览器。

**前置条件**：请先运行 `/e2e-plan` 生成测试计划。

## 工作流程

### 0. 检查项目是否运行
- 尝试访问 `BASE_URL`（默认 `http://localhost:3000`）
- 如果项目未运行，询问用户：启动项目 / 仅从代码分析 / 取消

### 1. 读取测试计划
- 检查 `e2e/plan.md` 是否存在，不存在则提示先运行 `/e2e-plan`
- 解析 plan 中的用例清单，筛选出代码状态为 ❌ 的待生成用例
- 如果指定了页面参数，只匹配对应页面

### 1. 登录认证（如需要）
同 `/e2e-generate` 原流程。

### 2. 分析页面（使用 Playwright MCP）
对每个待生成的页面，使用 MCP 获取页面结构和交互元素。

### 3. 生成测试文件
在 `e2e/tests/` 下创建 `<page>.spec.ts`。

**⚠️ 冲突检测：** 如果目标文件已存在，会询问用户选择：
- **1️⃣ 覆盖** — 重新生成完整测试文件
- **2️⃣ 跳过** — 保留现有文件
- **3️⃣ 补充** — 在现有文件中追加新用例

### 4. 更新计划状态
生成完成后，将 `e2e/plan.md` 中对应用例的 ❌ 更新为 ✅。

### 5. 输出结果
列出本次生成的文件和用例数，显示计划完成进度。

## 选择器优先级
1. `getByRole()` / `getByText()` / `getByPlaceholder()`（可访问性定位器）
2. `getByTestId()`（如有 data-testid）
3. CSS 选择器

详细工作流程参考 skill 文档：`skills/e2e-generate/SKILL.md`

$ARGUMENTS
