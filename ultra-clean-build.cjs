const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('💥 超強力清理 + 重建...\n');

// 1. 徹底清理所有可能的緩存
console.log('🧹 清理所有緩存...\n');
const pathsToClean = [
  'dist',
  'node_modules/.vite',
  'node_modules/.cache',
  '.vite',
  '.cache',
  '.rollup.cache',
  'tsconfig.tsbuildinfo',
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

// 2. 使用最小化 Vite 配置
console.log('🔄 切換到最小配置...\n');
const originalConfig = path.join(__dirname, 'vite.config.ts');
const backupConfig = path.join(__dirname, 'vite.config.backup.ts');
const minimalConfig = path.join(__dirname, 'vite.config.minimal.ts');

if (fs.existsSync(originalConfig)) {
  fs.copyFileSync(originalConfig, backupConfig);
}
fs.copyFileSync(minimalConfig, originalConfig);

// 3. 構建
console.log('🔨 開始構建（使用最小配置）...\n');
try {
  execSync('npm run build', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      // 強制 Vite 重新解析所有模塊
      VITE_FORCE: 'true',
    }
  });
  
  console.log('\n✅ 構建成功！🎉\n');
  
  // 恢復配置
  console.log('🔄 恢復原配置...\n');
  if (fs.existsSync(backupConfig)) {
    fs.copyFileSync(backupConfig, originalConfig);
    fs.unlinkSync(backupConfig);
  }
  
  // 檢查構建產物
  const distPath = path.join(__dirname, 'dist');
  if (fs.existsSync(distPath)) {
    const files = fs.readdirSync(distPath);
    console.log('📦 構建產物：');
    files.forEach(file => {
      const filePath = path.join(distPath, file);
      const stats = fs.statSync(filePath);
      const size = (stats.size / 1024).toFixed(2);
      console.log(`   ${file}: ${size} KB`);
    });
  }
  
  console.log('\n🚀 CaseWHR 平台已準備就緒！\n');
  console.log('💡 下一步：');
  console.log('   npm run preview - 本地預覽構建結果');
  console.log('   vercel deploy - 部署到 Vercel\n');
} catch (error) {
  console.log('\n❌ 構建失敗\n');
  
  // 恢復配置
  if (fs.existsSync(backupConfig)) {
    fs.copyFileSync(backupConfig, originalConfig);
    fs.unlinkSync(backupConfig);
  }
  
  console.log('🔍 調試建議：');
  console.log('   1. 檢查錯誤信息中提到的文件路徑');
  console.log('   2. 確認所有導入的文件都存在');
  console.log('   3. 檢查文件擴展名是否正確 (.ts vs .tsx)');
  console.log('   4. 嘗試完全重新安裝依賴：');
  console.log('      rm -rf node_modules package-lock.json');
  console.log('      npm install\n');
  
  process.exit(1);
}
