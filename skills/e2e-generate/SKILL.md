---
name: e2e-generate
description: 分析项目的前端代码和文档，自动生成 Playwright E2E 测试脚本。当用户要求生成测试、编写 e2e 测试或"自动测试"时触发。使用 Playwright MCP 服务器与页面交互获取准确的选择器。
argument-hint: "[页面名称或路由路径，留空则扫描所有页面]"
allowed-tools: Read, Grep, Glob, Bash, Write, WebFetch
---

# 生成 E2E 测试脚本

根据项目的前端源代码和文档，自动为每个页面生成高质量的 Playwright E2E 测试脚本。

## 工作流程

### 前置检查：登录认证处理

**首先检查项目是否需要登录。在阶段 2 使用 MCP 浏览器导航到第一个页面后，如果被重定向到登录页，必须按以下流程处理认证后才能继续生成测试：**

1. **检测登录页**：用 `browser_snapshot` 获取当前页面快照，检查是否出现登录表单（用户名/密码输入框、登录按钮等）
2. **询问用户凭证**：如果确实需要登录，**立即主动向用户提问**，要求提供以下信息（不要假设默认值）：
   ```
   ⚠️ 检测到登录页面，请提供测试账号信息：
   - 登录页 URL（如 /login、/signin）：______
   - 测试用户名：______
   - 测试密码：______
   ```
3. **执行登录**：使用用户提供的凭证，通过 MCP 工具完成登录：
   - 用 `browser_navigate` 打开登录页 URL
   - 用 `browser_snapshot` 确认表单元素
   - 用 `browser_fill_form` 或 `browser_type` 填写用户名/密码
   - 点击登录按钮
   - 用 `browser_snapshot` 验证登录成功（URL 不再是登录页）
4. **保存凭证到环境变量**：通知用户将凭证设置为环境变量，供后续测试运行使用：
   ```
   set TEST_USERNAME=<用户名>
   set TEST_PASSWORD=<密码>
   set LOGIN_URL=<登录路径>
   ```
5. **生成的测试不需要处理登录**：所有测试自动从 `e2e/auth.setup.ts` + `storageState` 获取已认证状态，测试代码聚焦页面功能，不应包含登录流程

### 阶段 1：分析项目结构

1. 读取 `package.json` 了解项目技术栈（React / Vue / Angular / Next.js / Nuxt 等）
2. 扫描前端源代码目录，识别页面/路由文件：
   - **Vue 项目**：扫描 `src/views/`、`src/pages/`、`src/router/`、`/pages/`
   - **React 项目**：扫描 `src/pages/`、`src/routes/`、`app/`、`src/App.tsx`
   - **Next.js**：扫描 `app/` 目录（App Router）或 `pages/` 目录（Pages Router）
   - **Nuxt**：扫描 `pages/` 目录
   - **Angular**：扫描 `src/app/` 下的路由配置
   - **通用**：扫描 `src/router/`、`src/routes.ts`、`src/router.ts`
3. 读取路由配置文件理解 URL 路径与组件的对应关系
4. 如果项目有 README 或 API 文档，一并阅读以了解功能描述
5. 输出页面清单：列出所有可测试的页面及其 URL 路径

### 阶段 2：分析页面结构（使用 Playwright MCP）

对每个识别出的页面：

1. **启动 Playwright MCP**：如果尚未运行，通过 `.mcp.json` 配置的 MCP 服务器会自动可用
2. **导航到页面**：使用 MCP 工具 `browser_navigate` 打开该页面的 URL
3. **获取页面快照**：使用 `browser_snapshot` 获取页面的可访问性树
4. **分析页面元素**：识别以下关键元素类型：
   - 表单（输入框、下拉框、复选框、提交按钮）
   - 链接和导航元素
   - 按钮和可点击元素
   - 列表和表格
   - 模态框和弹窗
   - 错误提示和验证信息区域
5. **截图保存**：使用 `browser_take_screenshot` 保存页面截图以供参考
6. **交互测试**：对交互元素进行操作测试（点击、填写表单、导航），记录操作路径

### 阶段 3：生成测试代码

为每个页面创建一个测试文件 `e2e/tests/<page-name>.spec.ts`，**所有测试共用同一个 Page 实例**，不重复打开关闭浏览器，按顺序连续执行：

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

1. **使用 web-first assertions**：优先使用 `toBeVisible()`、`toHaveText()`、`toHaveValue()` 等 Playwright web-first 断言
2. **选择器策略**：
   - 优先使用 `getByRole()`、`getByText()`、`getByPlaceholder()` 等可访问性定位器
   - 其次使用 `getByTestId()`（如果代码中有 data-testid）
   - 最后使用 CSS 选择器（需确保稳定性）
3. **等待策略**：使用 Playwright 的自动等待机制，避免 `page.waitFor(XXX)` 等硬等待
4. **场景覆盖**：每个页面至少包含：
   - 页面加载正确性测试（标题、关键元素可见）
   - 主要交互流程测试（表单提交、导航跳转等）
   - 边界情况（空数据、错误输入等）
5. **测试数据**：使用硬编码的测试数据或在 `beforeEach` 中准备
6. **禁止在测试中重复登录**：测试从 `storageState` 自动获取已认证状态，不要在测试用例中写登录流程。登录认证统一由 `e2e/auth.setup.ts` 处理，在测试运行前自动执行。

### 阶段 4：输出结果

生成完成后输出以下信息：

```
✅ E2E 测试生成完成！

📋 扫描到 N 个页面：
  - /page1  → e2e/tests/page1.spec.ts
  - /page2  → e2e/tests/page2.spec.ts
  ...

📝 共生成 N 个测试文件，包含 N 个测试用例

▶️ 下一步：使用 /e2e-automation:e2e-run 运行测试
```

## 注意事项

1. **Base URL**：确保在运行前设置了 `BASE_URL` 环境变量，或在 `playwright.config.ts` 中配置
2. **登录态**：如果页面需要登录，需要在测试中添加登录流程或使用已认证的 storage state
3. **动态内容**：对于包含动态内容（如日期、随机数据）的页面，使用通用断言而非具体值
4. **SPA 应用**：对于单页应用，确保测试涵盖路由跳转后的页面状态验证
5. **框架兼容性**：根据框架使用合适的定位策略（Vue 的 data-testid、React 的 aria-label 等）

## 示例

### 为登录页面生成测试

```
/e2e-automation:e2e-generate 登录
```

生成 `e2e/tests/login.spec.ts`，包含：
- 页面加载测试（标题、登录表单可见）
- 成功登录测试（输入凭证 → 提交 → 跳转首页）
- 失败登录测试（错误密码 → 显示错误信息）
- 表单验证测试（空输入 → 显示验证提示）

### 为所有页面生成测试

```
/e2e-automation:e2e-generate
```

扫描所有路由，为每个页面生成对应的测试文件。
