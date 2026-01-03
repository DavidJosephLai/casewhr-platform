const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔥 完全重置構建環境...\n');

// 1. 徹底清理
console.log('🧹 清理所有構建相關文件...\n');
const dirsToClean = [
  'dist',
  'node_modules/.vite',
  'node_modules/.cache',
  '.vite',
  '.cache',
];

dirsToClean.forEach(dir => {
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

// 2. 設置環境變量強制重新解析
console.log('⚙️  設置構建環境變量...\n');
process.env.VITE_FORCE_OPTIMIZE = 'true';

// 3. 嘗試構建
console.log('🔨 開始構建（使用強制優化）...\n');
try {
  execSync('npm run build', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      VITE_FORCE_OPTIMIZE: 'true'
    }
  });
  console.log('\n✅ 構建成功！🎉\n');
  console.log('🚀 CaseWHR 平台已準備就緒！\n');
} catch (error) {
  console.log('\n❌ 構建失敗，錯誤信息如上\n');
  console.log('📝 常見解決方案：');
  console.log('   1. 檢查是否有循環依賴');
  console.log('   2. 確保所有導入路徑正確');
  console.log('   3. 嘗試刪除 node_modules 並重新安裝');
  console.log('\n');
  process.exit(1);
}
