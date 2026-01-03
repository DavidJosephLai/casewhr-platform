const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Rollup installation issue...\n');

// 1. 檢查並刪除 Rollup
const rollupPath = path.join(__dirname, 'node_modules', 'rollup');
if (fs.existsSync(rollupPath)) {
  console.log('🗑️  Removing existing Rollup...');
  fs.rmSync(rollupPath, { recursive: true, force: true });
  console.log('✅ Rollup removed\n');
}

// 2. 刪除 vite (它依賴 rollup)
const vitePath = path.join(__dirname, 'node_modules', 'vite');
if (fs.existsSync(vitePath)) {
  console.log('🗑️  Removing existing Vite...');
  fs.rmSync(vitePath, { recursive: true, force: true });
  console.log('✅ Vite removed\n');
}

// 3. 重新安裝 Vite (會自動安裝正確的 Rollup)
console.log('📦 Reinstalling Vite and Rollup...');
try {
  execSync('npm install vite --force', { stdio: 'inherit' });
  console.log('\n✅ Vite and Rollup reinstalled successfully!\n');
} catch (error) {
  console.log('❌ Failed to reinstall:', error.message);
}

console.log('🎉 Done! Now run: npm run build');
