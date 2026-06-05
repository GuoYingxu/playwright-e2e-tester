---
name: e2e-generate
description: 根据 e2e/plan.md 测试计划，自动生成 Playwright E2E 测试代码。使用 Playwright MCP 获取页面结构生成准确的选择器。计划由 /e2e-plan 先生成。
argument-hint: "[页面名称或路由路径，留空则按 plan 生成所有未完成的用例]"
allowed-tools: Read, Grep, Glob, Bash, Write, WebFetch
---

# 生成 E2E 测试代码

根据 `e2e/plan.md` 测试计划，为每个页面生成 Playwright E2E 测试脚本。**请先确保已通过 `/e2e-plan` 生成了测试计划。**

所有测试共用同一个 Page 实例，顺序连续执行，不反复打开关闭浏览器。

## 工作流程

### 前置检查 1：检查项目是否在运行

**在使用 MCP 浏览器分析页面之前，必须先确认项目已经启动。**

1. 从环境变量 `BASE_URL` 获取项目地址，如果未设置则默认 `http://localhost:3000`
2. 使用 `browser_navigate` 尝试访问 `BASE_URL`
3. 设置合理的超时判断（约 5-8 秒），如果页面无法加载（超时、连接拒绝、DNS 解析失败等），说明项目未运行

**如果项目未运行，立即主动向用户提问**：

```
⚠️ 无法访问项目（BASE_URL），项目似乎未在运行。

请选择处理方式：

1️⃣ 启动项目 - 我手动启动项目，完成后你继续
2️⃣ 跳过浏览器 - 仅从源代码分析生成测试代码（选择器可能不够精确）
3️⃣ 取消 - 终止操作

请输入选项（1/2/3）：
```

根据用户选择执行：
- **1️⃣ 启动项目**：等待用户确认项目已启动后，再次尝试访问。如果仍然无法访问，提示用户检查 BASE_URL 设置。
- **2️⃣ 跳过浏览器**：后续所有 MCP 浏览器分析步骤跳过，仅基于源代码分析（路由、组件模板、API 文档）生成测试代码。**需要在输出结果中注明"部分用例基于代码静态分析生成，建议运行项目后重新生成以获取更准确的选择器"。**
- **3️⃣ 取消**：终止整个流程。

> **提示**：如果用户选择"跳过浏览器"，后续的登录认证检查也一同跳过。

### 前置检查 2：登录认证处理

在项目可访问的前提下，使用 MCP 浏览器导航到页面时，如果被重定向到登录页，**立即主动向用户提问**，要求提供测试账号。

### 阶段 0：读取测试计划

**这是第一步。** 先检查 `e2e/plan.md` 是否存在：

- **如果不存在**：提示用户先运行 `/e2e-plan` 生成测试计划，终止流程
  ```
  ⚠️ 未找到 e2e/plan.md，请先运行 /e2e-automation:e2e-plan 生成测试计划
  ```
- **如果存在**：读取 `e2e/plan.md`，解析 Markdown 表格，提取所有页面的测试用例清单

解析 plan.md 的方法：
1. 找到 `### /路由 — 页面名` 标题，识别页面
2. 解析该标题下的 `| # | 测试用例 | 代码 |` 表格
3. 筛选出代码状态为 `❌`（未生成）的用例
4. 如果用户指定了页面参数，只保留匹配的页面

**输出筛选结果**：列出计划中待生成的页面和用例数。

```
📋 测试计划中共有 N 个页面，M 个待生成的用例：
  - /route1 (3 个待生成)
  - /route2 (2 个待生成)
```

### 阶段 1：分析页面结构（使用 Playwright MCP）

对每个有待生成用例的页面：

1. **导航到页面**：使用 `browser_navigate` 打开该页面的 URL
2. **获取页面快照**：使用 `browser_snapshot` 获取页面的可访问性树
3. **分析页面元素**：识别以下关键元素类型：
   - 表单（输入框、下拉框、复选框、提交按钮）
   - 链接和导航元素
   - 按钮和可点击元素
   - 列表和表格
   - 模态框和弹窗
   - 错误提示和验证信息区域
4. **截图保存**：使用 `browser_take_screenshot` 保存页面截图以供参考
5. **交互测试**：对交互元素进行操作测试（点击、填写表单、导航），记录操作路径

### 阶段 2：生成测试代码

对每个页面生成测试文件 `e2e/tests/<page-name>.spec.ts`。**测试用例名称必须与 plan.md 保持一致。**

#### 2.1 冲突检测：处理已有测试文件

**在生成每个测试文件前，检查 `e2e/tests/<page-name>.spec.ts` 是否已存在。**

如果文件已存在，**立即主动向用户提问**，给出以下选项让用户选择：

```
⚠️ 测试文件 e2e/tests/<page-name>.spec.ts 已存在，请选择处理方式：

1️⃣ 覆盖 - 重新生成完整测试文件（现有内容将被替换）
2️⃣ 跳过 - 保留现有文件，不生成此页面测试
3️⃣ 补充 - 在现有文件中追加新的测试用例（保留已有用例）

请输入选项（1/2/3）：
```

根据用户选择执行相应操作：
- **覆盖**：直接创建新文件覆盖原有内容
- **跳过**：跳过此页面，继续处理下一个页面
- **补充**：先读取现有文件内容，只追加 plan 中标记 `❌` 且文件中不存在的测试用例

#### 2.2 生成模板

所有测试共用同一个 Page 实例，顺序连续执行：

```typescript
import { test, expect, type Page } from '@playwright/test';

// 串行模式：同一个文件内的测试按顺序执行，前一个测试的结果影响后一个
test.describe.configure({ mode: 'serial' });

let page: Page;

test.beforeAll(async ({ browser }) => {
  // 只创建一次 Page，所有测试共用
  page = await browser.newPage();
});

test.afterAll(async () => {
  // 全部测试完成后关闭 Page
  await page.close();
});

test.describe('<页面名称>', () => {

  test('页面加载正确', async () => {
    await page.goto('/<页面路由>');
    await page.waitForLoadState('networkidle');

    // 检查页面标题
    await expect(page).toHaveTitle(/预期标题/);
    
    // 检查关键元素可见
    await expect(page.locator('<选择器>')).toBeVisible();
    // ... 更多断言
  });

  test('<交互场景 1>', async () => {
    // 继承上一个测试的页面状态，继续操作
    await page.click('<选择器>');
    await page.fill('<输入框选择器>', '<值>');
    await page.click('<提交按钮选择器>');
    
    // 结果断言
    await expect(page.locator('<结果元素选择器>')).toBeVisible();
  });

  // ... 更多测试场景，依次在同一 Page 上执行
});
```

#### 生成的测试代码要求

1. **测试用例名称必须与 plan.md 完全一致**，以便后续状态追踪
2. **使用 web-first assertions**：优先使用 `toBeVisible()`、`toHaveText()`、`toHaveValue()` 等 Playwright web-first 断言
3. **选择器策略**：
   - 优先使用 `getByRole()`、`getByText()`、`getByPlaceholder()` 等可访问性定位器
   - 其次使用 `getByTestId()`（如果代码中有 data-testid）
   - 最后使用 CSS 选择器（需确保稳定性）
4. **等待策略**：使用 Playwright 的自动等待机制，避免 `page.waitFor(XXX)` 等硬等待
5. **测试数据**：使用硬编码的测试数据或在 `beforeEach` 中准备
6. **禁止在测试中重复登录**：测试从 `storageState` 自动获取已认证状态，不要在测试用例中写登录流程

### 阶段 3：更新测试计划状态

**每次生成完一个页面的测试代码后，必须更新 `e2e/plan.md`，将该页面对应用例的 `❌` 改为 `✅`。**

更新规则：
- 用例已成功生成 → `❌` → `✅`
- 用户选择了"跳过" → 保持 `❌` 不变
- 用户选择了"补充"，文件已存在的新用例 → `❌` → `✅`
- 如果该页所有用例都是 `✅` → 页面清单汇总表的"代码状态"列更新为 `✅`
- 如果部分生成 → 汇总表状态更新为 `🔄`

**更新方法**：用 `edit_file` 或 `write_file` 直接修改 `e2e/plan.md` 中对应用例行的 `❌` 为 `✅`。

### 阶段 4：输出结果

生成完成后输出以下信息：

```
✅ E2E 测试生成完成！

📋 本次生成:
  - /page1 → e2e/tests/page1.spec.ts (3 个用例 ✅)
  - /page2 → e2e/tests/page2.spec.ts (2 个用例 ✅)

📊 计划进度: 5/8 用例已完成 (62%)

📄 计划文件: e2e/plan.md
▶️ 下一步：使用 /e2e-automation:e2e-run 运行测试
```

## 注意事项

1. **必须先有 plan**：`e2e/plan.md` 不存在时不要自行扫描路由，引导用户先运行 `/e2e-plan`
2. **plan 状态同步**：每次生成代码都要更新 plan.md 的状态，保持同步
3. **Base URL**：确保在运行前设置了 `BASE_URL` 环境变量，或在 `playwright.config.ts` 中配置
4. **登录态**：如果页面需要登录，需要在测试中添加登录流程或使用已认证的 storage state
5. **动态内容**：对于包含动态内容（如日期、随机数据）的页面，使用通用断言而非具体值
6. **SPA 应用**：对于单页应用，确保测试涵盖路由跳转后的页面状态验证
7. **框架兼容性**：根据框架使用合适的定位策略（Vue 的 data-testid、React 的 aria-label 等）

## 示例

```
/e2e-automation:e2e-generate              # 按 plan 生成所有未完成的用例
/e2e-automation:e2e-generate 登录         # 只生成"登录"页面的用例
/e2e-automation:e2e-generate /user/profile # 只生成指定路由页面的用例
```
