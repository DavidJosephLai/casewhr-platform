const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 完全重新安裝所有依賴...\n');

// 1. 刪除 node_modules
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log('🗑️  刪除 node_modules（這需要一些時間）...');
  try {
    fs.rmSync(nodeModulesPath, { recursive: true, force: true });
    console.log('✅ node_modules 已刪除\n');
  } catch (error) {
    console.log(`❌ 無法刪除 node_modules: ${error.message}`);
    console.log('請手動刪除 node_modules 文件夾後重新運行此腳本\n');
    process.exit(1);
  }
}

// 2. 刪除 package-lock.json
const lockPath = path.join(__dirname, 'package-lock.json');
if (fs.existsSync(lockPath)) {
  console.log('🗑️  刪除 package-lock.json...');
  fs.unlinkSync(lockPath);
  console.log('✅ package-lock.json 已刪除\n');
}

// 3. 刪除所有緩存
const cacheDirs = ['dist', '.vite', '.cache'];
cacheDirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (fs.existsSync(fullPath)) {
    console.log(`🗑️  刪除 ${dir}...`);
    fs.rmSync(fullPath, { recursive: true, force: true });
    console.log(`✅ ${dir} 已刪除`);
  }
});

console.log('\n📦 清理 npm 緩存...\n');
try {
  execSync('npm cache clean --force', { stdio: 'inherit' });
  console.log('✅ npm 緩存已清理\n');
} catch (error) {
  console.log('⚠️  緩存清理警告（可忽略）\n');
}

console.log('📦 重新安裝所有依賴（這需要幾分鐘）...\n');
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
} catch (error) {
  console.log('\n❌ 構建失敗\n');
  process.exit(1);
}

console.log('🎉 完成！項目已完全重建！');
