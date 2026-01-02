import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

// 获取 __dirname (ESM 模块中需要)
const __dirname = fileURLToPath(new URL('.', import.meta.url));

// 🚫 过滤 HTML 插件 - 只允许 index.html
const filterHtmlPlugin = () => {
  return {
    name: 'filter-html',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // 只允许访问 index.html，阻止其他 HTML 文件
        if (req.url && req.url.endsWith('.html') && !req.url.includes('index.html')) {
          res.statusCode = 404;
          res.end('Not Found');
          return;
        }
        next();
      });
    }
  };
};

// WASM 錯誤抑制插件 - 在 HTML 注入前執行
const wasmErrorSuppressor = () => {
  return {
    name: 'wasm-error-suppressor',
    transformIndexHtml(html: string) {
      // 注入到 <head> 最前面，比任何其他腳本都早執行
      const suppressorScript = `
        <script>
          (function() {
            'use strict';
            // 立即執行，在任何模塊加載之前
            const _error = console.error;
            const _warn = console.warn;
            
            console.error = function(...args) {
              const text = String(args.join(' ')).toLowerCase();
              if (text.includes('webassembly') || text.includes('wasm') || text.includes('compilation')) {
                return; // 完全靜默
              }
              _error.apply(console, args);
            };
            
            console.warn = function(...args) {
              const text = String(args.join(' ')).toLowerCase();
              if (text.includes('webassembly') || text.includes('wasm')) return;
              _warn.apply(console, args);
            };
            
            const blockError = function(e) {
              const msg = String(e?.message || e?.reason?.message || e?.reason || e || '').toLowerCase();
              if (msg.includes('webassembly') || msg.includes('wasm') || msg.includes('compilation')) {
                if (e?.preventDefault) e.preventDefault();
                if (e?.stopPropagation) e.stopPropagation();
                if (e?.stopImmediatePropagation) e.stopImmediatePropagation();
                return true;
              }
            };
            
            window.addEventListener('error', blockError, { capture: true, passive: false });
            window.addEventListener('unhandledrejection', blockError, { capture: true, passive: false });
            
            const _onerror = window.onerror;
            window.onerror = function(msg, src, line, col, err) {
              const text = String(msg).toLowerCase();
              if (text.includes('webassembly') || text.includes('wasm') || text.includes('compilation')) {
                return true;
              }
              return _onerror ? _onerror(msg, src, line, col, err) : false;
            };
            
            // DOM 清理
            const cleanup = function() {
              try {
                const selectors = ['vite-error-overlay', '[id*="error"]', '[class*="error"]'];
                selectors.forEach(function(sel) {
                  try {
                    document.querySelectorAll(sel).forEach(function(el) {
                      const text = (el.textContent || '').toLowerCase();
                      if (text.includes('webassembly') || text.includes('wasm')) {
                        el.remove();
                      }
                    });
                  } catch(e) {}
                });
              } catch(e) {}
            };
            
            // 高頻率清理
            setInterval(cleanup, 16);
            
            // 立即執行
            setTimeout(cleanup, 0);
            setTimeout(cleanup, 50);
            setTimeout(cleanup, 100);
            setTimeout(cleanup, 200);
            setTimeout(cleanup, 500);
            
            console.log('%c🛡️ WASM錯誤抑制器已啟動（Vite插件）', 'color:#4CAF50;font-weight:bold;font-size:14px;');
          })();
        </script>
      `;
      
      // 插入到 <head> 開頭
      return html.replace('<head>', '<head>' + suppressorScript);
    }
  };
};

// Public 文件複製插件 - 確保 robots.txt 被複製到 dist
const copyPublicFiles = () => {
  return {
    name: 'copy-public-files',
    closeBundle() {
      const files = ['robots.txt', 'sitemap.xml']; // 明确指定小写文件名
      files.forEach(file => {
        const src = resolve(process.cwd(), 'public', file);
        const dest = resolve(process.cwd(), 'dist', file);
        if (existsSync(src)) {
          copyFileSync(src, dest);
          console.log(`✅ 已複製 ${file} 到 dist/`);
        } else {
          console.warn(`⚠️ 警告：找不到 public/${file}`);
        }
      });
    }
  };
};

export default defineConfig({
  plugins: [
    filterHtmlPlugin(), // 🚫 过滤其他 HTML 文件
    // wasmErrorSuppressor(), // 🔧 临时禁用以排查 CSP 问题
    react(),
    copyPublicFiles() // 添加複製插件
  ],
  publicDir: 'public', // 明確指定 public 文件夾
  
  // 🔧 明确指定入口文件，避免扫描其他 HTML
  root: process.cwd(),
  
  build: {
    // 禁用 WASM 相關的優化
    target: 'esnext',
    
    // ⚡ 性能優化：代碼分割配置
    rollupOptions: {
      // 🎯 明确���定唯一入口，禁止自动扫描
      input: resolve(__dirname, 'index.html'),
      
      output: {
        // 手動分包策略
        manualChunks(id) {
          // React 核心庫
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          
          // UI 組件庫（單獨打包，便於緩存）
          if (id.includes('/components/ui/')) {
            return 'ui-components';
          }
          
          // 管理員相關（僅管理員訪問，單獨分包）
          if (id.includes('/components/admin/') || id.includes('/pages/AdminPage')) {
            return 'admin-bundle';
          }
          
          // 圖表和分析庫
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3')) {
            return 'charts';
          }
          
          // 表單相關
          if (id.includes('node_modules/react-hook-form') || id.includes('node_modules/zod')) {
            return 'forms';
          }
          
          // Supabase 和 API 客戶端
          if (id.includes('node_modules/@supabase') || id.includes('node_modules/axios')) {
            return 'api-client';
          }
          
          // 其他大型第三方庫
          if (id.includes('node_modules/')) {
            return 'vendor';
          }
        },
        
        // 輸出文件命名（包含 hash 以支持長期緩存）
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
      
      onwarn(warning, warn) {
        // 忽略 WASM 相關的警告
        if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return;
        if (warning.message.includes('webassembly')) return;
        if (warning.message.includes('wasm')) return;
        warn(warning);
      }
    },
    
    // 增加 chunk 大小警告閾值（從默認的 500KB 增加到 1MB，因為我們有很多功能）
    chunkSizeWarningLimit: 1000,
    
    // 啟用 CSS 代碼分割
    cssCodeSplit: true,
    
    // 壓縮配置
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // 保留 console（生產環境可改為 true）
        drop_debugger: true,
        pure_funcs: ['console.debug'], // 移除 console.debug
      },
    },
    
    // 生成 sourcemap（開發時使用，生產環境可關閉以減小體積）
    sourcemap: false,
  },
  
  server: {
    // 開發服務器配置
    hmr: {
      overlay: false // 禁用錯誤覆蓋層
    }
  },
  
  optimizeDeps: {
    // 排除可能導致 WASM 問題的依賴
    exclude: [],
    
    // ⚡ 預構建優化：包含常用依賴
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
    ],
  },
  
  // ⚡ 性能：啟用實驗性功能
  experimental: {
    // 啟用 renderBuiltUrl 以優化資源加載
    renderBuiltUrl(filename: string) {
      return '/' + filename;
    },
  },
});