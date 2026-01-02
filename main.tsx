import React from 'react';
import ReactDOM from 'react-dom/client';
// import { HelmetProvider } from 'react-helmet-async'; // ❌ 移除 - 未安装的依赖
import App from './App.tsx';
import './styles/globals.css';
// import { registerServiceWorker } from './utils/serviceWorkerUtils';

// 🔧 临时禁用 Service Worker 进行调试
// if (import.meta.env.PROD) {
//   registerServiceWorker({
//     onUpdate: (registration) => {
//       console.log('🔄 [SW] New version available');
//     },
//     onSuccess: (registration) => {
//       console.log('✅ [SW] Service Worker registered:', registration);
//     },
//     onError: (error) => {
//       console.error('❌ [SW] Service Worker registration failed:', error);
//     },
//   });
// }

console.log('🚀 [main.tsx] Starting...');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

console.log('🚀 [main.tsx] Render initiated');