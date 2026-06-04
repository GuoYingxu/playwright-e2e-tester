#!/usr/bin/env node

/**
 * E2E 自动化项目初始化脚本
 * 检查环境并安装依赖
 *
 * 用法: node e2e/scripts/init-project.mjs
 */

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const E2E_DIR = resolve(__dirname, '..');

function run(cmd, opts = {}) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { cwd: ROOT, stdio: 'inherit', ...opts });
}

function checkNodeVersion() {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0], 10);
  if (major < 18) {
    console.error(`❌ Node.js 18+ 是必需的，当前为 ${version}`);
    process.exit(1);
  }
  console.log(`✅ Node.js ${version}`);
}

function checkDependencies() {
  const nodeModules = resolve(ROOT, 'node_modules');
  if (existsSync(nodeModules)) {
    console.log('✅ node_modules 已存在');
    return true;
  }
  return false;
}

function checkBrowsers() {
  try {
    execSync('npx playwright --version', { cwd: ROOT, stdio: 'pipe' });
    console.log('✅ Playwright 已安装');
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log('=== Playwright E2E 项目初始化 ===\n');

  // 1. 检查 Node.js
  checkNodeVersion();

  // 2. 安装 npm 依赖
  if (!checkDependencies()) {
    console.log('\n📦 安装 npm 依赖...');
    run('npm install');
  }

  // 3. 检查 Playwright 浏览器
  if (!checkBrowsers()) {
    console.log('\n🌐 未检测到 Playwright，尝试安装...');
    try {
      run('npx playwright install chromium');
    } catch {
      console.log('  尝试安装 Playwright CLI...');
      run('npm install -D @playwright/test');
      run('npx playwright install chromium');
    }
  }

  // 4. 检查目录结构
  const testsDir = resolve(E2E_DIR, 'tests');
  const reportsDir = resolve(E2E_DIR, 'reports');

  if (!existsSync(testsDir)) {
    console.log('\n📁 创建 e2e/tests/ 目录');
    run(`mkdir -p "${testsDir}"`);
  }

  if (!existsSync(reportsDir)) {
    console.log('\n📁 创建 e2e/reports/ 目录');
    run(`mkdir -p "${reportsDir}"`);
  }

  console.log('\n✅ 初始化完成！');
  console.log('\n下一步：');
  console.log('  1. 设置应用的基础 URL 环境变量:');
  console.log('     set BASE_URL=http://localhost:3000');
  console.log('  2. 使用 /e2e-automation:e2e-generate 生成测试');
  console.log('  3. 使用 /e2e-automation:e2e-run 运行测试');
}

main().catch(err => {
  console.error('初始化失败:', err.message);
  process.exit(1);
});
