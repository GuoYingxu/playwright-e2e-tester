---
name: e2e-generate
description: 分析项目前端代码，自动生成 Playwright E2E 测试脚本。扫描路由/页面，使用 Playwright MCP 获取页面结构，生成 .spec.ts 测试文件。
argument-hint: "[页面名称或路由路径，留空扫描所有页面]"
---

# 生成 E2E 测试脚本

分析项目的前端代码和文档，自动生成 Playwright E2E 测试脚本。所有测试共用同一个 Page 实例，顺序连续执行，不反复打开关闭浏览器。

详细工作流程参考 skill 文档：`skills/e2e-generate/SKILL.md`

## 快速执行步骤

### 0. 登录认证（如需要）

使用 MCP 导航到页面后，如果被重定向到登录页，**立即主动向用户提问**，要求提供测试账号：

```
⚠️ 检测到登录页面，请提供测试账号信息：
- 登录页 URL（如 /login、/signin）：______
- 测试用户名：______
- 测试密码：______
```

然后用 MCP 工具完成登录：
1. `browser_navigate` → 登录页
2. `browser_snapshot` → 确认表单元素
3. `browser_fill_form` / `browser_type` → 填写凭证
4. 点击登录按钮 → 验证登录成功

告知用户将凭证设为环境变量供后续使用：`set TEST_USERNAME=...`

### 1. 分析项目结构
- 读取 `package.json` 了解技术栈
- 扫描 `src/pages/`、`src/views/`、`src/router/`、`app/`、`pages/` 等目录识别页面和路由
- 输出页面清单及其 URL 路径

### 2. 分析页面（使用 Playwright MCP）
通过 `.mcp.json` 配置的 Playwright MCP 服务器获取页面结构：
- 使用 `browser_navigate` 打开页面
- 使用 `browser_snapshot` 获取可访问性树
- 识别表单、按钮、链接、表格等交互元素

### 3. 生成测试文件
在 `e2e/tests/` 下创建 `<page>.spec.ts`，模板如下：

```typescript
import { test, expect, type Page } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
});

test.afterAll(async () => {
  await page.close();
});

test.describe('<页面名称>', () => {
  test('页面加载正确', async () => {
    await page.goto('/<路由>');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveTitle(/预期标题/);
  });

  test('<交互场景>', async () => {
    // 继承上一个测试的页面状态，继续操作
    await page.click('<选择器>');
    await expect(page.locator('<结果>')).toBeVisible();
  });
});
```

### 4. 选择器优先级
1. `getByRole()` / `getByText()` / `getByPlaceholder()`（可访问性定位器）
2. `getByTestId()`（如有 data-testid）
3. CSS 选择器

### 5. 输出结果
列出生成的文件和测试数，提示下一步使用 `/e2e-run` 运行测试。

$ARGUMENTS
