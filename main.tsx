import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './styles/globals.css';

console.log('🚀 [main.tsx] Starting React App...');

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
  
  console.log('✅ [main.tsx] React App rendered successfully');
} catch (error) {
  console.error('❌ [main.tsx] Failed to render React App:', error);
  
  // 显示错误信息
  const rootEl = document.getElementById('root');
  if (rootEl) {
    rootEl.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        padding: 20px;
        text-align: center;
      ">
        <h1 style="font-size: 28px; margin: 0 0 15px 0;">❌ 應用啟動失敗</h1>
        <p style="font-size: 16px; margin: 0 0 10px 0;">請嘗試刷新頁面 (Ctrl + Shift + R)</p>
        <p style="font-size: 14px; margin: 20px 0 0 0; opacity: 0.8; max-width: 500px;">
          錯誤詳情: ${error}
        </p>
      </div>
    `;
  }
}