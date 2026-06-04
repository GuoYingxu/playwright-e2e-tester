---
name: e2e-run
description: 运行 Playwright E2E 测试并生成 HTML 测试报告。当用户要求运行测试、执行测试、查看测试结果或生成测试报告时触发。自动汇总测试结果并输出通过的/失败的测试数量。
argument-hint: "[测试文件名称或标签过滤条件，留空运行所有测试]"
allowed-tools: Read, Grep, Glob, Bash
---

# 运行 E2E 测试

执行已生成的 Playwright E2E 测试脚本，生成 HTML 测试报告，并展示测试结果摘要。

## 工作流程

### 阶段 1：检查测试文件

1. 检查 `e2e/tests/` 目录是否存在且包含 `.spec.ts` 文件
2. 如果没有任何测试文件，提示用户先使用 `/e2e-automation:e2e-generate` 生成测试
3. 如果传入了过滤参数，使用 Glob 匹配查找对应的测试文件

### 阶段 2：运行测试

解析参数 `$ARGUMENTS` 构建命令。基准命令：

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

**判断逻辑**：扫描 `$ARGUMENTS`，如果包含 `--headed` 则在命令末尾追加 `--headed`；如果包含 `--debug` 则追加 `--debug`；剩余非标志参数作为文件名过滤条件添加到文件路径。

#### 环境变量

- **`BASE_URL`**：设置被测试应用的基础 URL（默认 `http://localhost:3000`）
  ```
  set BASE_URL=http://localhost:8080 && npx playwright test ...
  ```

### 阶段 3：处理测试结果

1. 测试完成后，Playwright 自动生成 HTML 报告到 `e2e/reports/` 目录
2. 从命令行输出中提取测试统计信息：

   ```
   ├── 总测试数: N
   ├── 通过: N
   ├── 失败: N
   └── 跳过: N
   ```
3. 如果有失败测试，列出失败的测试名称和错误摘要
4. 如果测试全部通过，确认所有测试均成功

### 阶段 4：输出报告信息

输出类似以下格式的摘要：

```
✅ 测试执行完毕！

📊 测试结果:
  ├── 总测试数: 15
  ├── ✅ 通过: 13
  ├── ❌ 失败: 1
  └── ⏭️  跳过: 1

❌ 失败测试:
  - "登录页面 错误密码显示提示" → expect(received).toBeVisible() 超时

📁 HTML 报告: e2e/reports/index.html
💡 使用 `npx playwright show-report e2e/reports` 在浏览器中查看详细报告
```

## 注意事项

1. **应用需在运行中**：测试前确保被测试的应用正在运行（`BASE_URL` 可访问）
2. **首次运行**：首次运行前需执行 `npm run install:browsers` 安装浏览器
3. **顺序执行 + 同 Page 共享**：
   - `workers: 1` 确保测试文件之间顺序执行，不并行
   - 每个测试文件内部使用 `serial` 模式 + 共享 `Page` 实例，浏览器只启动一次，页面不反复创建销毁
   - 前一个测试的页面状态会延续到下一个测试
4. **登录认证**：测试运行前会自动执行 `e2e/auth.setup.ts` 进行登录。如遇登录失败：
   - 设置正确的环境变量：`set TEST_USERNAME=...`、`set TEST_PASSWORD=...`
   - 或修改 `e2e/auth.setup.ts` 中的登录表单选择器
5. **失败重试**：CI 环境下自动启用 2 次重试，本地默认不重试
6. **截图和视频**：失败测试会自动保存截图和视频到 `test-results/` 目录

## 示例

### 运行所有测试

```
/e2e-automation:e2e-run
```
输出所有测试的完整摘要报告。

### 运行特定测试

```
/e2e-automation:e2e-run login
```
只运行文件名包含 "login" 的测试文件。

### 以有头模式运行（查看浏览器操作）

```
/e2e-automation:e2e-run --headed
```
浏览器可见地运行测试，便于调试。

### 调试模式

```
/e2e-automation:e2e-run --debug
```
使用 Playwright Inspector 逐步调试测试。
