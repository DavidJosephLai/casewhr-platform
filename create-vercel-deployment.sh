#!/bin/bash

echo "🚀 开始创建 CaseWhr Platform 文件..."

# 创建目录
mkdir -p styles public

# 创建 package.json
cat > package.json << 'EOF'
{
  "name": "casewhr-platform",
  "version": "1.0.0",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@supabase/supabase-js": "latest",
    "sonner": "2.0.3",
    "lucide-react": "latest"
  },
  "devDependencies": {
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.4.2",
    "typescript": "^5.5.3",
    "tailwindcss": "^4.0.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.41"
  }
}
EOF

# 创建 vite.config.ts
cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    outDir: 'dist'
  }
});
EOF

# 创建 tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false
  },
  "include": ["*.tsx", "*.ts"]
}
EOF

# 创建 index.html
cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="zh-TW">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CaseWhr - Professional Global Freelancing Platform</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/main.tsx"></script>
  </body>
</html>
EOF

# 创建 main.tsx
cat > main.tsx << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

# 创建 App.tsx
cat > App.tsx << 'EOF'
import { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🚀 CaseWhr Platform
        </h1>
        <p className="text-xl text-gray-600 mb-6">
          Professional Global Freelancing Platform
        </p>
        <div className="bg-blue-50 rounded-lg p-6 mb-6">
          <p className="text-lg text-gray-700 mb-4">
            ✅ Vercel 部署成功！
          </p>
          <p className="text-sm text-gray-600">
            完整的平台功能即将上线！
          </p>
        </div>
        <button
          onClick={() => setCount(count + 1)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
        >
          点击测试: {count}
        </button>
        <div className="mt-8 text-sm text-gray-500">
          <p>🌍 三语言支持 | 💰 三货币系统 | 💳 多支付集成</p>
        </div>
      </div>
    </div>
  );
}
EOF

# 创建 styles/globals.css
cat > styles/globals.css << 'EOF'
@import "tailwindcss";

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
EOF

echo ""
echo "✅ 所有文件创建完成！"

