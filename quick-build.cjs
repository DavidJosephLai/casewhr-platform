const { execSync } = require('child_process');

console.log('📦 安裝缺失的依賴...\n');
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
  console.log('🎉 完成！項目已成功構建！');
} catch (error) {
  console.log('\n❌ 構建失敗\n');
  process.exit(1);
}
