const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('☢️  核彈級修復 - 完全重置依賴...\n');

// 1. 刪除所有可能損壞的文件
console.log('🗑️  Step 1: 刪除所有構建產物和緩存...\n');
const pathsToDelete = [
  'dist',
  'node_modules',
  'package-lock.json',
  'node_modules/.vite',
  'node_modules/.cache',
  '.vite',
  '.cache',
  'tsconfig.tsbuildinfo',
];

pathsToDelete.forEach(item => {
  const fullPath = path.join(__dirname, item);
  if (fs.existsSync(fullPath)) {
    console.log(`   🗑️  刪除 ${item}...`);
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`   ✅ ${item} 已刪除`);
    } catch (error) {
      console.log(`   ⚠️  無法刪除 ${item}: ${error.message}`);
    }
  } else {
    console.log(`   ⏭️  ${item} 不存在，跳過`);
  }
});

console.log('\n✅ 清理完成\n');

// 2. 重新安裝依賴
console.log('📦 Step 2: 重新安裝所有依賴...\n');
console.log('   這可能需要幾分鐘，請耐心等待...\n');

try {
  execSync('npm install', { 
    stdio: 'inherit',
    cwd: __dirname
  });
  console.log('\n✅ 依賴安裝完成\n');
} catch (error) {
  console.log('\n❌ 依賴安裝失敗\n');
  console.log('請手動運行: npm install\n');
  process.exit(1);
}

// 3. 使用最小配置構建
console.log('🔨 Step 3: 使用最小配置構建...\n');

const originalConfig = path.join(__dirname, 'vite.config.ts');
const backupConfig = path.join(__dirname, 'vite.config.backup.ts');
const minimalConfig = path.join(__dirname, 'vite.config.minimal.ts');

// 備份原配置
if (fs.existsSync(originalConfig)) {
  fs.copyFileSync(originalConfig, backupConfig);
  console.log('   💾 已備份原配置\n');
}

// 切換到最小配置
if (fs.existsSync(minimalConfig)) {
  fs.copyFileSync(minimalConfig, originalConfig);
  console.log('   🔄 已切換到最小配置\n');
} else {
  console.log('   ⚠️  最小配置不存在，使用原配置\n');
}

// 4. 構建
console.log('🔨 開始構建...\n');
try {
  execSync('npm run build', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
    }
  });
  
  console.log('\n🎉 構建成功！\n');
  
  // 恢復配置
  if (fs.existsSync(backupConfig)) {
    fs.copyFileSync(backupConfig, originalConfig);
    fs.unlinkSync(backupConfig);
    console.log('✅ 已恢復原配置\n');
  }
  
  console.log('🚀 CaseWHR 平台已準備就緒！\n');
  console.log('💡 下一步：');
  console.log('   npm run preview - 本地預覽');
  console.log('   vercel deploy - 部署到 Vercel\n');
  
} catch (error) {
  console.log('\n❌ 構建失敗\n');
  
  // 恢復配置
  if (fs.existsSync(backupConfig)) {
    fs.copyFileSync(backupConfig, originalConfig);
    fs.unlinkSync(backupConfig);
  }
  
  console.log('請查看上方錯誤信息，並嘗試以下步驟：\n');
  console.log('1. 檢查是否有文件路徑錯誤');
  console.log('2. 確認所有導入的模塊都存在');
  console.log('3. 檢查 TypeScript 類型錯誤\n');
  
  process.exit(1);
}
