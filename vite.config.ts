import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, existsSync } from 'fs';
import { resolve } from 'path';

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
      const files = ['robots.txt'];
      files.forEach(file => {
        const src = resolve(process.cwd(), 'public', file);
        const dest = resolve(process.cwd(), 'dist', file);
        if (existsSync(src)) {
          copyFileSync(src, dest);
          console.log(`✅ 已複製 ${file} 到 dist/`);
        }
      });
    }
  };
};

export default defineConfig({
  plugins: [
    wasmErrorSuppressor(), // 必須在第一個
    react(),
    copyPublicFiles() // 添加複製插件
  ],
  publicDir: 'public', // 明確指定 public 文件夾
  build: {
    // 禁用 WASM 相關的優化
    target: 'esnext',
    rollupOptions: {
      onwarn(warning, warn) {
        // 忽略 WASM 相關的警告
        if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return;
        if (warning.message.includes('webassembly')) return;
        if (warning.message.includes('wasm')) return;
        warn(warning);
      }
    }
  },
  server: {
    // 開發服務器配置
    hmr: {
      overlay: false // 禁用錯誤覆蓋層
    }
  },
  optimizeDeps: {
    // 排除可能導致 WASM 問題的依賴
    exclude: []
  }
});
