#!/usr/bin/env node

/**
 * 测试报告摘要生成脚本
 * 读取 Playwright HTML 报告目录，输出测试统计摘要
 *
 * 用法: node e2e/scripts/generate-report.mjs
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = resolve(__dirname, '../reports');

function findReportFiles() {
  if (!existsSync(REPORTS_DIR)) {
    return [];
  }

  const files = readdirSync(REPORTS_DIR);
  return files
    .filter(f => f.endsWith('.html') || f.endsWith('.json'))
    .map(f => resolve(REPORTS_DIR, f));
}

function readReportSummary() {
  // 尝试读取 Playwright HTML 报告中嵌入的 JSON 数据
  // Playwright 将测试数据作为 script 标签嵌入在 index.html 中
  const indexPath = resolve(REPORTS_DIR, 'index.html');

  if (!existsSync(indexPath)) {
    return null;
  }

  const html = readFileSync(indexPath, 'utf-8');

  // 尝试从 HTML 中提取 window.__playwright__ 数据
  const match = html.match(/window\.__playwright__\s*=\s*({.*?});/);
  if (match) {
    try {
      return JSON.parse(match[1]);
    } catch {
      return null;
    }
  }

  return null;
}

function formatDuration(ms) {
  if (!ms) return '-';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const min = Math.floor(ms / 60000);
  const sec = Math.round((ms % 60000) / 1000);
  return `${min}m ${sec}s`;
}

async function main() {
  console.log('=== Playwright 测试报告摘要 ===\n');

  const reportFiles = findReportFiles();

  if (reportFiles.length === 0) {
    console.log('⚠️ 未找到测试报告文件。');
    console.log('   请先运行测试：/e2e-automation:e2e-run');
    process.exit(0);
  }

  console.log(`📄 报告文件 (${reportFiles.length}):`);
  for (const file of reportFiles) {
    const relativePath = file.replace(resolve(__dirname, '../..'), '.');
    console.log(`   - ${relativePath}`);
  }

  const summary = readReportSummary();
  if (summary) {
    console.log('\n📊 测试统计:');
    // 如果无法解析 JSON，至少显示文件路径
  }

  console.log(`\n📁 报告目录: ${REPORTS_DIR}`);
  console.log('💡 使用以下命令在浏览器中打开报告:');
  console.log('   npx playwright show-report e2e/reports');
}

main().catch(err => {
  console.error('读取报告失败:', err.message);
  process.exit(1);
});
