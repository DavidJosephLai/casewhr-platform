const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 清理並重建項目...\n');

// 1. 刪除 dist 目錄
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  console.log('🗑️  刪除 dist 目錄...');
  fs.rmSync(distPath, { recursive: true, force: true });
  console.log('✅ dist 已刪除\n');
}

// 2. 刪除 node_modules/.vite 緩存
const viteCache = path.join(__dirname, 'node_modules', '.vite');
if (fs.existsSync(viteCache)) {
  console.log('🗑️  刪除 Vite 緩存...');
  fs.rmSync(viteCache, { recursive: true, force: true });
  console.log('✅ Vite 緩存已刪除\n');
}

// 3. 刪除 .vite 目錄（如果存在於根目錄）
const rootViteCache = path.join(__dirname, '.vite');
if (fs.existsSync(rootViteCache)) {
  console.log('🗑️  刪除根目錄 .vite 緩存...');
  fs.rmSync(rootViteCache, { recursive: true, force: true });
  console.log('✅ .vite 緩存已刪除\n');
}

// 4. 重新構建
console.log('🔨 開始構建...\n');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('\n✅ 構建成功！\n');
} catch (error) {
  console.log('\n❌ 構建失敗\n');
  process.exit(1);
}

console.log('🎉 完成！');
