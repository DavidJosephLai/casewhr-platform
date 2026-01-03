const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔥 超級清理 + 重建...\n');

// 1. 徹底清理所有緩存和構建產物
console.log('🧹 清理所有緩存和構建產物...\n');
const pathsToClean = [
  'dist',
  'node_modules/.vite',
  'node_modules/.cache',
  '.vite',
  '.cache',
  'node_modules/rollup',
  'node_modules/@rollup',
  'node_modules/vite',
];

pathsToClean.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (fs.existsSync(fullPath)) {
    console.log(`🗑️  刪除 ${dir}...`);
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`✅ ${dir} 已刪除`);
    } catch (error) {
      console.log(`⚠️  無法刪除 ${dir}: ${error.message}`);
    }
  }
});

console.log('\n✅ 清理完成\n');

// 2. 重新安裝關鍵依賴
console.log('📦 重新安裝 Vite 和 Rollup...\n');
try {
  console.log('正在重新安裝...');
  execSync('npm install vite@latest --force', { stdio: 'inherit' });
  console.log('✅ Vite 重新安裝完成\n');
} catch (error) {
  console.log('⚠️  重新安裝可能有警告，繼續嘗試構建...\n');
}

// 3. 使用最小配置構建
console.log('💾 備份原配置...\n');
const originalConfig = path.join(__dirname, 'vite.config.ts');
const backupConfig = path.join(__dirname, 'vite.config.backup.ts');

if (fs.existsSync(originalConfig)) {
  fs.copyFileSync(originalConfig, backupConfig);
}

console.log('🔄 切換到最小配置...\n');
const minimalConfig = path.join(__dirname, 'vite.config.minimal.ts');
fs.copyFileSync(minimalConfig, originalConfig);

// 4. 構建
console.log('🔨 開始構建（使用最小配置）...\n');
try {
  execSync('npm run build', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
    }
  });
  
  console.log('\n✅ 構建成功！🎉\n');
  
  // 恢復配置
  console.log('🔄 恢復原配置...\n');
  if (fs.existsSync(backupConfig)) {
    fs.copyFileSync(backupConfig, originalConfig);
    fs.unlinkSync(backupConfig);
  }
  
  console.log('🚀 CaseWHR 平台已準備就緒！\n');
} catch (error) {
  console.log('\n❌ 構建仍然失敗\n');
  
  // 恢復配置
  if (fs.existsSync(backupConfig)) {
    fs.copyFileSync(backupConfig, originalConfig);
    fs.unlinkSync(backupConfig);
  }
  
  console.log('💡 建議：');
  console.log('   1. 嘗試完全刪除 node_modules 並重新安裝: rm -rf node_modules && npm install');
  console.log('   2. 檢查是否有循環依賴');
  console.log('   3. 檢查 ApiDocumentation.tsx 是否有不正確的導入\n');
  
  process.exit(1);
}
