# Playwright E2E Automation — Claude Code Plugin

基于 [Playwright](https://playwright.dev) 官方测试框架和 [MCP 服务器](https://playwright.dev/docs/getting-started-mcp)，自动为项目生成 E2E 测试脚本并运行测试产出报告的 Claude Code 插件。

## 插件命令

### 调用方式

插件提供两种调用方式，功能完全相同：

| Slash 命令（短） | Skill 命令（带命名空间） | 说明 |
|------------------|--------------------------|------|
| `/e2e-generate [页面名]` | `/e2e-automation:e2e-generate [页面名]` | 分析前端代码，自动生成 Playwright E2E 测试脚本 |
| `/e2e-run [参数]` | `/e2e-automation:e2e-run [参数]` | 运行测试并生成 HTML 测试报告 |

两个命令完全独立——生成测试不影响测试运行，运行测试不需要重新生成。

### `/e2e-run` 参数说明

| 参数 | 效果 |
|------|------|
| 无参数 | 无头模式运行所有测试 |
| `--headed` | 有头模式，浏览器可见 |
| `--debug` | 调试模式（Playwright Inspector） |
| `<文件名>` | 只运行文件名匹配的测试 |
| `<文件名> --headed` | 文件名过滤 + 有头模式 |

## 前置条件

- [Node.js](https://nodejs.org) 18 或更高版本
- [Claude Code](https://code.claude.com) 已安装并可用
- 被测试的前端应用可在本地运行

## 快速开始

### 1. 安装依赖

```bash
# 在项目根目录执行
npm install
npx playwright install chromium
```

### 2. 启动被测试的应用

```bash
# 启动你的前端应用，例如：
npm run dev
# 或提供 BASE_URL 环境变量
set BASE_URL=http://localhost:5173
```

### 3. 生成测试脚本

在 Claude Code 中执行：

```
/e2e-generate
```

插件会自动：
1. 扫描项目源码，识别所有页面/路由
2. 通过 Playwright MCP 服务器打开页面，获取页面结构
3. **如果页面需要登录，Agent 会主动询问你输入测试账号**（仅需在生成时一次登录）
4. 生成测试文件到 `e2e/tests/` 目录

### 4. 运行测试

```bash
# 无头模式（默认）
/e2e-run

# 有头模式（看浏览器操作）
/e2e-run --headed

# 只运行 login 相关测试
/e2e-run login --headed
```

测试顺序执行，完成后在 `e2e/reports/` 目录生成 HTML 报告。

## 登录认证处理

如果被测应用需要登录才能访问：

**生成测试时**（Agent 自动处理）：

Agent 通过 MCP 浏览器导航页面时，如果被重定向到登录页，会**主动向你提问**：

```
⚠️ 检测到登录页面，请提供测试账号信息：
- 登录页 URL：______
- 测试用户名：______
- 测试密码：______
```

使用 MCP 工具在浏览器中完成登录后，Agent 会提示你将凭证设为环境变量供后续测试运行使用。

**运行测试时**（自动执行）：

测试运行前 `e2e/auth.setup.ts` 自动读取环境变量并执行登录：

```bash
set TEST_USERNAME=<你的用户名>
set TEST_PASSWORD=<你的密码>
set LOGIN_URL=/login
```

所有测试文件直接从 `storageState` 获取已认证状态，**测试代码本身不包含任何登录逻辑**。

## 测试执行模式

```
浏览器进程（只启动一次）
  └─ Browser Context（含 storageState 认证态）
       └─ Page ──┬── test1（goto → 断言）
                  ├── test2（继承状态 → 点击 → 断言）
                  ├── test3（继承状态 → 填表 → 断言）
                  └── testN（继续...）
```

- `workers: 1` — 测试文件之间顺序执行，不并行
- `serial` 模式 — 文件内所有测试共用同一个 Page 实例，不反复创建销毁浏览器页面
- 前一个测试的页面状态自然延续到下一个测试

## 项目结构

```
项目根目录/
├── .claude-plugin/
│   └── plugin.json              # 插件清单
├── .mcp.json                    # Playwright MCP 服务器配置
├── commands/
│   ├── e2e-generate.md          # /e2e-generate 命令
│   └── e2e-run.md               # /e2e-run 命令
├── skills/
│   ├── e2e-generate/
│   │   └── SKILL.md             # 生成测试的 skill
│   └── e2e-run/
│       └── SKILL.md             # 运行测试的 skill
├── e2e/
│   ├── playwright.config.ts     # Playwright 测试框架配置
│   ├── auth.setup.ts            # 共享登录认证脚本（测试运行前自动执行）
│   ├── .auth/                   # 登录态 storageState 缓存目录
│   ├── scripts/
│   │   ├── init-project.mjs     # 项目初始化脚本
│   │   └── generate-report.mjs  # 报告摘要生成脚本
│   ├── tests/                   # ★ 生成的测试文件存放处
│   │   └── *.spec.ts
│   └── reports/                 # ★ HTML 测试报告输出目录
│       └── index.html
├── package.json                 # Node.js 项目配置
├── tsconfig.json                # TypeScript 配置
└── README.md                    # 本文档
```

## 工作原理

### 测试生成（e2e-generate）

1. **分析项目** — 扫描 `package.json` 和源码，识别路由/页面（支持 Vue、React、Next.js、Nuxt、Angular）
2. **MCP 交互** — 通过 Playwright MCP 服务器打开每个页面，获取可访问性快照
3. **登录检测** — 如遇登录页，Agent 主动询问用户凭证并完成登录
4. **生成代码** — 为每个页面创建 `e2e/tests/<page>.spec.ts`，使用 web-first assertions
5. **共享 Page** — 生成的文件使用 `serial` 模式 + `beforeAll` 共享 Page，测试顺序执行

### 测试运行（e2e-run）

1. **检查** — 确认 `e2e/tests/` 目录存在测试文件
2. **认证** — 自动执行 `auth.setup.ts` 完成登录，保存 storageState
3. **执行** — 运行 Playwright 测试（支持 `--headed` / `--debug` / 文件名过滤）
4. **报告** — 产出 HTML 报告到 `e2e/reports/`，输出测试统计摘要

## 自定义配置

### Playwright 配置

编辑 `e2e/playwright.config.ts`：
- `timeout`：测试超时时间（默认 30s）
- `retries`：失败重试次数
- `workers`：Worker 数（当前 1，改为大于 1 则并行）
- `projects`：添加更多浏览器（Firefox、WebKit）

### MCP 服务器配置

编辑 `.mcp.json`：
- `--browser`：切换浏览器（chromium / firefox / webkit）
- `--headless`：无头模式/有头模式（默认无头）
- `--caps`：添加额外能力（vision / pdf / devtools）

## 常见问题

**Q: 生成测试时找不到页面？**
A: 确保被测试的应用正在运行，并设置正确的 `BASE_URL` 环境变量。

**Q: 生成测试时被重定向到登录页？**
A: Agent 会检测到登录页并主动向你询问测试账号，按提示输入即可。

**Q: 测试运行失败，提示浏览器未安装？**
A: 执行 `npx playwright install chromium` 安装浏览器。

**Q: 如何在不同端口运行应用？**
A: 设置环境变量 `set BASE_URL=http://localhost:8080`。

**Q: 测试选择器不稳定？**
A: 优先在代码中添加 `data-testid` 属性，Playwright 的 `getByTestId()` 是最稳定的定位方式。

**Q: 如何看到浏览器操作过程？**
A: 使用 `/e2e-run --headed` 以有头模式运行测试，浏览器窗口可见。

## 许可证

MIT
