# Playwright E2E Automation — Claude Code Plugin

基于 [Playwright](https://playwright.dev) 官方测试框架和 [MCP 服务器](https://playwright.dev/docs/getting-started-mcp)，自动为项目生成 E2E 测试脚本并运行测试产出报告的 Claude Code 插件。

## 完整工作流程

插件提供**三步工作流**：计划 → 生成 → 运行。每一步有对应的 slash 命令。

```
/e2e-plan              ───→   生成测试计划（plan.md）
   │                            纯静态分析，无需运行项目
   │                            输出：测试用例名称清单 + 代码生成状态
   ▼
/e2e-generate          ───→   根据计划生成测试代码
   │                            需要项目运行（也可选择静态分析模式）
   │                            输出：e2e/tests/*.spec.ts + 更新 plan 状态
   ▼
/e2e-run               ───→   运行测试并产出报告
                             输出：e2e/reports/index.html
```

---

## 插件命令

### 调用方式

插件提供两种调用方式，功能完全相同：

| Slash 命令（短） | Skill 命令（带命名空间） | 说明 |
|-----------------|-------------------------|------|
| `/e2e-plan [页面名]` | `/e2e-automation:e2e-plan [页面名]` | 分析项目代码，生成测试计划（plan.md） |
| `/e2e-generate [页面名]` | `/e2e-automation:e2e-generate [页面名]` | 根据 plan.md 生成 Playwright E2E 测试脚本 |
| `/e2e-run [参数]` | `/e2e-automation:e2e-run [参数]` | 运行测试并生成 HTML 测试报告 |

### `/e2e-plan` — 生成测试计划

扫描项目源代码（路由配置、组件模板、API 代码），输出 Markdown 格式的测试计划到 `e2e/plan.md`。

**纯静态分析，无需运行项目。**

包含：
- 页面清单汇总表（路由、页面名、用例数、代码生成状态）
- 每个页面的测试用例清单（用例名 + ❌/✅ 状态标记）

支持参数过滤：`/e2e-plan 登录` 只分析"登录"相关页面。

### `/e2e-generate` — 生成测试代码

根据 `e2e/plan.md` 的内容，逐个页面生成 `e2e/tests/<page>.spec.ts`。

**自动检查项目是否运行：**
- 项目可访问 → 用 MCP 浏览器分析页面，生成精确选择器
- 项目未运行 → 用户可选择：① 启动项目后继续 ② 仅从代码静态分析生成（选择器精度较低）③ 取消

**冲突处理：** 如果测试文件已存在，用户可选择：
- **1️⃣ 覆盖** — 重新生成完整文件
- **2️⃣ 跳过** — 保留现有文件
- **3️⃣ 补充** — 在现有文件中追加新用例

**生成完成后**自动更新 `e2e/plan.md` 状态：`❌` → `✅`，进度可视化。

### `/e2e-run` — 运行测试

| 参数 | 效果 |
|------|------|
| 无参数 | 无头模式运行所有测试 |
| `--headed` | 有头模式，浏览器可见 |
| `--debug` | 调试模式（Playwright Inspector） |
| `<文件名>` | 只运行文件名匹配的测试 |
| `<文件名> --headed` | 文件名过滤 + 有头模式 |

---

## plan.md 文件格式

`e2e/plan.md` 是计划与生成之间的桥梁，Markdown 格式，可手动编辑。

```markdown
# E2E 测试计划

项目: MyApp
生成时间: 2025-05-20T10:00:00

## 页面清单

| # | 路由 | 页面名称 | 用例数 | 代码状态 |
|---|------|---------|--------|---------|
| 1 | /login | 登录页 | 3 | 🔄 部分生成 |
| 2 | /user/profile | 个人中心 | 4 | ❌ 未生成 |

### /login — 登录页

| # | 测试用例 | 代码 |
|---|---------|------|
| 1 | 页面加载正确 - 显示登录表单 | ✅ |
| 2 | 成功登录 - 输入正确凭证跳转首页 | ✅ |
| 3 | 登录失败 - 错误密码显示错误信息 | ❌ |

### /user/profile — 个人中心

| # | 测试用例 | 代码 |
|---|---------|------|
| 1 | 页面加载正确 - 显示用户信息 | ❌ |
| 2 | 编辑个人信息 - 修改昵称成功 | ❌ |
```

用户可手动编辑此文件增删用例，`/e2e-generate` 会自动识别新加的 `❌` 用例并生成代码。

---

## 前置条件

- [Node.js](https://nodejs.org) 18 或更高版本
- [Claude Code](https://code.claude.com) 已安装并可用
- 被测试的前端应用可在本地运行（仅 generate/run 需要，plan 不需要）

## 安装插件到 Claude Code

```bash
# 克隆仓库 → 安装依赖 → 启动 Claude Code 并挂载
git clone <本仓库地址>
cd playwright-e2e-tester
npm install && npx playwright install chromium
claude --plugin-dir <插件文件位置 比如 E:/playwright-e2e-tester>
```

启动后插件命令即刻可用。如需在 Claude Code 运行中重新加载插件：

```
/reload-plugins
```

## 快速开始

### 1. 安装依赖

```bash
# 在项目根目录执行
cd playwright-e2e-tester
npm install
npx playwright install chromium
```

### 2. 生成测试计划

```bash
# 在 Claude Code 中执行
/e2e-plan
```

插件会自动：
1. 扫描 `package.json` 了解技术栈
2. 扫描路由配置，识别所有页面
3. 读取组件源码，分析页面功能
4. 输出 `e2e/plan.md`，列出测试用例名称清单

### 3. 生成测试代码

```bash
# 在 Claude Code 中执行
/e2e-generate
```

插件会自动：
1. 读取 `e2e/plan.md`，筛选未完成的用例
2. 检查项目是否在运行
   - 运行中 → 通过 MCP 浏览器分析页面结构，生成精确选择器
   - 未运行 → 询问用户选择处理方式
3. 如果页面需要登录，Agent 会主动询问你输入测试账号
4. 生成测试文件到 `e2e/tests/` 目录
5. 更新 `e2e/plan.md` 状态

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

### 完整示例：增量开发流程

```
# 初始：生成计划
/e2e-plan
→ 识别 5 个页面，规划 20 个用例

# 第一次：生成第一批测试
/e2e-generate 登录
→ 生成 login.spec.ts（3 个用例 ✅）

# 第二次：继续生成
/e2e-generate
→ 识别 plan 中还有 17 个 ❌ 用例
→ 询问每个已有文件的处理方式（覆盖/跳过/补充）
→ 逐步生成，更新计划进度

# 随时查看进度
查看 e2e/plan.md 表格中的 ✅/❌ 状态

# 运行已完成的测试
/e2e-run login
```

---

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

---

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

---

## 项目结构

```
项目根目录/
├── .claude-plugin/
│   └── plugin.json              # 插件清单
├── .mcp.json                    # Playwright MCP 服务器配置
├── commands/
│   ├── e2e-plan.md              # /e2e-plan 命令描述
│   ├── e2e-generate.md          # /e2e-generate 命令描述
│   └── e2e-run.md               # /e2e-run 命令描述
├── skills/
│   ├── e2e-plan/
│   │   └── SKILL.md             # 生成测试计划的完整指令
│   ├── e2e-generate/
│   │   └── SKILL.md             # 生成测试代码的完整指令
│   └── e2e-run/
│       └── SKILL.md             # 运行测试的完整指令
├── e2e/
│   ├── plan.md                  # ★ 测试计划文件（由 /e2e-plan 生成）
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

---

## 工作原理

### 测试计划（e2e-plan）

1. **分析项目** — 扫描 `package.json` 和源码，识别路由/页面
2. **读组件代码** — 分析模板/JSX 中的表单、按钮、列表等交互元素
3. **读 API 代码** — 理解数据交互逻辑
4. **输出 plan.md** — Markdown 表格，含页面清单和用例清单，状态全为 ❌
5. **纯静态** — 无需运行项目、无需浏览器、无需登录

### 测试生成（e2e-generate）

1. **读取计划** — 解析 `e2e/plan.md`，筛选 ❌ 待生成用例
2. **检查运行** — 尝试访问 `BASE_URL`，确认项目是否在运行
3. **MCP 交互** — 项目运行中时，通过 Playwright MCP 打开页面获取结构
4. **登录检测** — 如遇登录页，Agent 主动询问用户凭证并完成登录
5. **生成代码** — 为每个页面创建 `e2e/tests/<page>.spec.ts`
6. **冲突处理** — 已有文件询问覆盖/跳过/补充
7. **状态同步** — 更新 `e2e/plan.md`：❌ → ✅

### 测试运行（e2e-run）

1. **检查** — 确认 `e2e/tests/` 目录存在测试文件
2. **认证** — 自动执行 `auth.setup.ts` 完成登录，保存 storageState
3. **执行** — 运行 Playwright 测试（支持 `--headed` / `--debug` / 文件名过滤）
4. **报告** — 产出 HTML 报告到 `e2e/reports/`，输出测试统计摘要

---

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

---

## 常见问题

**Q: plan 和 generate 有什么区别？**
A: `plan` 只分析代码生成用例名称列表（静态，秒级完成），`generate` 根据 plan 生成实际可运行的测试代码（需要浏览器分析页面，较慢）。

**Q: 生成测试时找不到页面？**
A: 确保被测试的应用正在运行，并设置正确的 `BASE_URL` 环境变量。也可以选择"跳过浏览器"模式，仅从代码静态分析生成。

**Q: 生成测试时被重定向到登录页？**
A: Agent 会检测到登录页并主动向你询问测试账号，按提示输入即可。

**Q: 如何只生成部分页面的测试？**
A: 使用参数过滤：`/e2e-generate 登录` 或 `/e2e-generate /user/profile`。

**Q: 如何查看哪些测试已经生成、哪些还没生成？**
A: 查看 `e2e/plan.md` 中的状态列，`✅` 表示已完成，`❌` 表示待生成。

**Q: 想添加新的测试用例怎么办？**
A: 两种方式：① 手动编辑 `e2e/plan.md` 添加新行（标记 `❌`），再运行 `/e2e-generate`；② 重新运行 `/e2e-plan` 重新扫描。

**Q: 测试运行失败，提示浏览器未安装？**
A: 执行 `npx playwright install chromium` 安装浏览器。

**Q: 如何在不同端口运行应用？**
A: 设置环境变量 `set BASE_URL=http://localhost:8080`。

**Q: 测试选择器不稳定？**
A: 优先在代码中添加 `data-testid` 属性，Playwright 的 `getByTestId()` 是最稳定的定位方式。

**Q: 如何看到浏览器操作过程？**
A: 使用 `/e2e-run --headed` 以有头模式运行测试，浏览器窗口可见。

---

## 许可证

MIT
