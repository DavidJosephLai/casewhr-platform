const fs = require('fs');
const path = require('path');

console.log('🧹 Force cleaning ALL cache and build artifacts...\n');

const pathsToDelete = [
  'node_modules/.vite',
  'node_modules/.cache',
  'node_modules/@radix-ui',
  'dist',
  '.vite',
  '.cache',
];

pathsToDelete.forEach(p => {
  const fullPath = path.join(__dirname, p);
  try {
    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`✅ Deleted: ${p}`);
    } else {
      console.log(`⏭️  Skip (not found): ${p}`);
    }
  } catch (err) {
    console.log(`❌ Error deleting ${p}:`, err.message);
  }
});

console.log('\n✅ All cache cleaned!');
console.log('\n📦 Next steps:');
console.log('1. npm install');
console.log('2. npm run build');
