import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';
import { Toaster } from "sonner"; // ✅ 移除版本号

// 🎨 简单的测试组件
function TestContent() {
  const [count, setCount] = useState(0);
  
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        textAlign: 'center',
        maxWidth: '600px'
      }}>
        <h1 style={{ 
          fontSize: '36px', 
          marginBottom: '20px',
          color: '#333'
        }}>
          ✅ Figma Make 测试成功！
        </h1>
        
        <p style={{
          fontSize: '18px',
          color: '#666',
          marginBottom: '30px'
        }}>
          如果看到这个页面，说明以下功能正常：
        </p>
        
        <ul style={{
          listStyle: 'none',
          padding: 0,
          textAlign: 'left',
          marginBottom: '30px'
        }}>
          <li style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
            ✅ React 渲染正常
          </li>
          <li style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
            ✅ TypeScript 编译成功
          </li>
          <li style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
            ✅ Context Providers 工作正常
          </li>
          <li style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
            ✅ State 管理正常
          </li>
          <li style={{ padding: '10px' }}>
            ✅ CSS 加载成功
          </li>
        </ul>
        
        <div style={{ marginBottom: '20px' }}>
          <button 
            onClick={() => setCount(count + 1)}
            style={{
              padding: '15px 30px',
              fontSize: '18px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
            }}
          >
            点击测试: {count} 次
          </button>
        </div>
        
        <div style={{
          padding: '20px',
          background: '#f0f9ff',
          borderRadius: '10px',
          marginTop: '20px'
        }}>
          <h3 style={{ color: '#0369a1', marginBottom: '10px' }}>
            📋 下一步：
          </h3>
          <p style={{ color: '#0c4a6e', fontSize: '14px' }}>
            等待 GitHub 账号恢复后，推送修复到 Vercel
          </p>
        </div>
        
        <div style={{
          marginTop: '30px',
          fontSize: '12px',
          color: '#999'
        }}>
          🕐 当前时间: {new Date().toLocaleString('zh-TW')}
        </div>
      </div>
    </div>
  );
}

// 🚀 导出测试版本的 App
export default function AppTest() {
  console.log('🧪 [AppTest] Test version loading...');
  
  return (
    <AuthProvider>
      <ViewProvider>
        <TestContent />
        <Toaster />
      </ViewProvider>
    </AuthProvider>
  );
}