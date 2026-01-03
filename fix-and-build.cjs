const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 清理緩存...\n');

// 刪除緩存目錄
const cacheDirs = ['dist', 'node_modules/.vite', '.vite', '.cache'];
cacheDirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (fs.existsSync(fullPath)) {
    console.log(`🗑️  刪除 ${dir}...`);
    fs.rmSync(fullPath, { recursive: true, force: true });
  }
});

console.log('\n✅ 緩存清理完成\n');

console.log('📦 重新安裝依賴...\n');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('\n✅ 依賴安裝成功！\n');
} catch (error) {
  console.log('\n❌ 依賴安裝失敗\n');
  process.exit(1);
}

console.log('🔨 開始構建...\n');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('\n✅ 構建成功！\n');
  console.log('🎉 完成！');
} catch (error) {
  console.log('\n❌ 構建失敗\n');
  process.exit(1);
}
