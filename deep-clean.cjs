const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 徹底清理項目...\n');

const dirsToDelete = [
  'dist',
  'node_modules/.vite',
  'node_modules/.cache',
  '.vite',
  '.cache',
  'node_modules/rollup/dist',
];

dirsToDelete.forEach(dir => {
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

console.log('\n📦 重新安裝 Rollup...\n');
try {
  execSync('npm uninstall rollup', { stdio: 'inherit' });
  execSync('npm install rollup@latest --save-dev', { stdio: 'inherit' });
  console.log('\n✅ Rollup 重新安裝成功！\n');
} catch (error) {
  console.log('⚠️  Rollup 安裝警告（可忽略）\n');
}

console.log('📦 重新安裝 Vite...\n');
try {
  execSync('npm uninstall vite', { stdio: 'inherit' });
  execSync('npm install vite@latest --save-dev', { stdio: 'inherit' });
  console.log('\n✅ Vite 重新安裝成功！\n');
} catch (error) {
  console.log('⚠️  Vite 安裝警告（可忽略）\n');
}

console.log('🔨 開始構建...\n');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('\n✅ 構建成功！\n');
} catch (error) {
  console.log('\n❌ 構建失敗\n');
  process.exit(1);
}

console.log('🎉 完成！');
