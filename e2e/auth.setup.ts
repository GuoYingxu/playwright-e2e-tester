/**
 * 共享登录认证脚本
 *
 * 在运行测试前执行登录操作，保存认证状态（storageState）供所有测试用例复用。
 * 测试用例无需重复登录，直接从已认证状态开始。
 *
 * 环境变量配置（可选）：
 *   LOGIN_URL     - 登录页面路径，默认 /login
 *   TEST_USERNAME - 测试用户名，默认 testuser
 *   TEST_PASSWORD - 测试密码，默认 testpass
 *   BASE_URL      - 应用基础 URL
 */

import { test as setup, expect } from '@playwright/test';
import { resolve } from 'node:path';

const AUTH_FILE = resolve(import.meta.dirname, '../.auth/user.json');

setup('authenticate', async ({ page }) => {
  const loginUrl = process.env.LOGIN_URL || '/login';
  const username = process.env.TEST_USERNAME || 'testuser';
  const password = process.env.TEST_PASSWORD || 'testpass';

  console.log(`🔐 正在登录: ${loginUrl} (用户: ${username})`);

  await page.goto(loginUrl);

  // 等待登录表单加载完成
  await page.waitForLoadState('networkidle');

  // 自动检测登录表单字段并填写
  // 支持常见的登录表单字段命名
  const usernameField = page.locator([
    'input[type="text"][name*="user"]',
    'input[type="text"][name*="name"]',
    'input[type="email"]',
    'input[name="username"]',
    'input[name="email"]',
    'input[name="account"]',
    'input[placeholder*="用户"]',
    'input[placeholder*="账号"]',
    'input[placeholder*="邮箱"]',
    'input[placeholder*="user"]',
    'input[placeholder*="email"]',
  ].join(', '));

  const passwordField = page.locator([
    'input[type="password"]',
    'input[name="password"]',
    'input[name="passwd"]',
    'input[name="pwd"]',
    'input[placeholder*="密码"]',
    'input[placeholder*="password"]',
  ].join(', '));

  const submitButton = page.locator([
    'button[type="submit"]',
    'input[type="submit"]',
    'button:has-text("登录")',
    'button:has-text("登陆")',
    'button:has-text("登 录")',
    'button:has-text("sign in")',
    'button:has-text("login")',
    'button:has-text("提交")',
    'button:has-text("确认")',
  ].join(', '));

  // 填写表单
  if (await usernameField.isVisible({ timeout: 5000 }).catch(() => false)) {
    await usernameField.fill(username);
  }
  if (await passwordField.isVisible({ timeout: 3000 }).catch(() => false)) {
    await passwordField.fill(password);
  }

  // 提交登录
  if (await submitButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await submitButton.click();
  } else {
    // 如果找不到提交按钮，尝试按 Enter
    await page.keyboard.press('Enter');
  }

  // 等待登录完成——检测页面 URL 变化或特定元素出现
  await page.waitForLoadState('networkidle');

  // 验证登录成功：检测 URL 不再指向登录页
  const currentUrl = page.url();
  const loginPaths = ['/login', '/signin', '/auth'];
  const isStillOnLogin = loginPaths.some(p => currentUrl.includes(p));
  if (isStillOnLogin) {
    console.warn('⚠️  登录后可能仍在登录页面，请检查登录凭证是否正确');
    // 仍然保存当前状态，让测试自行决定
  } else {
    console.log(`✅ 登录成功，当前 URL: ${currentUrl}`);
  }

  // 保存认证状态
  await page.context().storageState({ path: AUTH_FILE });
  console.log(`💾 认证状态已保存: ${AUTH_FILE}`);
});
