const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 快速重建開始...\n');

// 1. 清理緩存
console.log('🧹 清理 Vite 緩存...\n');
const cacheDirs = ['dist', 'node_modules/.vite'];
cacheDirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (fs.existsSync(fullPath)) {
    console.log(`🗑️  刪除 ${dir}...`);
    fs.rmSync(fullPath, { recursive: true, force: true });
  }
});

console.log('\n✅ 緩存清理完成\n');

// 2. 嘗試構建
console.log('🔨 開始構建...\n');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('\n✅ 構建成功！🎉\n');
  console.log('平台已準備就緒！\n');
} catch (error) {
  console.log('\n❌ 構建失敗\n');
  process.exit(1);
}
