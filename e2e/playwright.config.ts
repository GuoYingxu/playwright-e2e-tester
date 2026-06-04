import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'node:path';

const AUTH_FILE = resolve(import.meta.dirname, '.auth/user.json');

export default defineConfig({
  // 测试文件匹配模式
  testDir: './tests',
  testMatch: '**/*.spec.ts',

  // 输出目录
  outputDir: '../test-results',

  // 超时设置
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },

  // 重试策略
  retries: process.env.CI ? 2 : 0,

  // 顺序执行——使用 1 个 worker 确保测试按文件顺序依次运行
  workers: 1,

  // 报告器配置
  reporter: [
    ['html', {
      outputFolder: './reports',
      open: 'never',
    }],
    ['list'],
  ],

  // 全局设置——所有测试共享认证状态
  use: {
    // baseURL 由生成测试时动态指定
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    // 使用共享登录态的 storageState
    storageState: AUTH_FILE,
  },

  // 浏览器项目
  projects: [
    // 登录设置项目——先执行登录，保存认证状态
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      testDir: './',
    },
    // 正式测试项目——依赖 setup，使用已认证的 storageState
    {
      name: 'chromium',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
    // 可扩展更多浏览器：
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    //   dependencies: ['setup'],
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    //   dependencies: ['setup'],
    // },
  ],
});
