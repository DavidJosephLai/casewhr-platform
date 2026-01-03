const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚨 緊急修復開始...\n');

// 1. 刪除所有緩存和構建產物
console.log('🧹 清理所有緩存...\n');
const dirsToDelete = [
  'dist',
  'node_modules/.vite',
  'node_modules/.cache',
  '.vite',
  '.cache',
  'node_modules/rollup',
];

dirsToDelete.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (fs.existsSync(fullPath)) {
    console.log(`🗑️  刪除 ${dir}...`);
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
    } catch (error) {
      console.log(`⚠️  無法刪除 ${dir}: ${error.message}`);
    }
  }
});

console.log('\n✅ 清理完成\n');

// 2. 重新安裝 Rollup
console.log('📦 重新安裝 Rollup...\n');
try {
  execSync('npm install rollup@latest --save-dev --force', { stdio: 'inherit' });
  console.log('\n✅ Rollup 重新安裝成功\n');
} catch (error) {
  console.log('\n⚠️  Rollup 安裝有警告，繼續...\n');
}

// 3. 重新安裝所有依賴
console.log('📦 重新安裝所有依賴...\n');
try {
  execSync('npm install --force', { stdio: 'inherit' });
  console.log('\n✅ 依賴安裝成功\n');
} catch (error) {
  console.log('\n❌ 依賴安裝失敗\n');
  process.exit(1);
}

// 4. 嘗試構建
console.log('🔨 嘗試構建...\n');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('\n✅ 構建成功！🎉\n');
} catch (error) {
  console.log('\n❌ 構建失敗，請查看錯誤信息\n');
  process.exit(1);
}
