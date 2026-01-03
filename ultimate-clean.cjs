const fs = require('fs');
const path = require('path');

console.log('🔥 ULTIMATE CLEAN - Removing ALL dependencies and cache...\n');

const pathsToDelete = [
  'node_modules',
  'package-lock.json',
  'dist',
  '.vite',
  '.cache',
];

pathsToDelete.forEach(p => {
  const fullPath = path.join(__dirname, p);
  try {
    if (fs.existsSync(fullPath)) {
      console.log(`🗑️  Deleting: ${p}...`);
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`✅ Deleted: ${p}`);
    } else {
      console.log(`⏭️  Skip (not found): ${p}`);
    }
  } catch (err) {
    console.log(`❌ Error deleting ${p}:`, err.message);
  }
});

console.log('\n✅ Ultimate clean completed!');
console.log('\n📦 Next steps:');
console.log('1. npm install');
console.log('2. npm run build');
