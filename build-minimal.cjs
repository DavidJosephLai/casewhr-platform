const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 使用最小配置構建...\n');

// 1. 清理
console.log('🧹 清理構建產物...\n');
const dirsToClean = ['dist', 'node_modules/.vite'];
dirsToClean.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (fs.existsSync(fullPath)) {
    console.log(`🗑️  刪除 ${dir}...`);
    fs.rmSync(fullPath, { recursive: true, force: true });
  }
});

console.log('\n✅ 清理完成\n');

// 2. 備份原配置
console.log('💾 備份原 vite.config.ts...\n');
const originalConfig = path.join(__dirname, 'vite.config.ts');
const backupConfig = path.join(__dirname, 'vite.config.backup.ts');

if (fs.existsSync(originalConfig)) {
  fs.copyFileSync(originalConfig, backupConfig);
  console.log('✅ 已備份到 vite.config.backup.ts\n');
}

// 3. 使用最小配置
console.log('🔄 切換到最小配置...\n');
const minimalConfig = path.join(__dirname, 'vite.config.minimal.ts');
fs.copyFileSync(minimalConfig, originalConfig);
console.log('✅ 已切換到最小配置\n');

// 4. 構建
console.log('🔨 開始構建...\n');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('\n✅ 構建成功！🎉\n');
  
  // 5. 恢復原配置
  console.log('🔄 恢復原配置...\n');
  if (fs.existsSync(backupConfig)) {
    fs.copyFileSync(backupConfig, originalConfig);
    fs.unlinkSync(backupConfig);
    console.log('✅ 已恢復原配置\n');
  }
  
  console.log('🚀 CaseWHR 平台已準備就緒！\n');
} catch (error) {
  console.log('\n❌ 構建失敗\n');
  
  // 恢復原配置
  console.log('🔄 恢復原配置...\n');
  if (fs.existsSync(backupConfig)) {
    fs.copyFileSync(backupConfig, originalConfig);
    fs.unlinkSync(backupConfig);
    console.log('✅ 已恢復原配置\n');
  }
  
  process.exit(1);
}
