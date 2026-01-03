const fs = require('fs');
const path = require('path');

// 递归读取所有 tsx 和 ts 文件
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      // 跳过 node_modules
      if (!filePath.includes('node_modules')) {
        getAllFiles(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

// 修复文件中的导入
function fixImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // 修复所有带版本号的包
  const patterns = [
    // @radix-ui 包的各种版本号格式
    { regex: /@radix-ui\/([\w-]+)@[\d.]+/g, replacement: '@radix-ui/$1' },
    // lucide-react 版本号
    { regex: /lucide-react@[\d.]+/g, replacement: 'lucide-react' },
    // class-variance-authority 版本号
    { regex: /class-variance-authority@[\d.]+/g, replacement: 'class-variance-authority' },
    // sonner 版本号
    { regex: /sonner@[\d.]+/g, replacement: 'sonner' },
  ];

  let newContent = content;
  patterns.forEach(({ regex, replacement }) => {
    if (regex.test(newContent)) {
      newContent = newContent.replace(regex, replacement);
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`✅ Fixed: ${filePath}`);
    return true;
  }
  return false;
}

// 主程序
console.log('🔍 Scanning for files with version numbers in imports...\n');

const rootDir = __dirname;
const files = getAllFiles(rootDir);

let fixedCount = 0;
files.forEach(file => {
  if (fixImports(file)) {
    fixedCount++;
  }
});

console.log(`\n🎉 Total files fixed: ${fixedCount}`);
console.log('\n✅ Done! Now run: npm run build');
