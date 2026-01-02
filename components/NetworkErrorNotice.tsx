/**
 * 🌐 网络错误提示组件
 * 
 * 当检测到 Supabase 网络错误时自动显示
 * 提示用户使用开发模式登录
 */

import { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Button } from './ui/button';

export function NetworkErrorNotice() {
  const [show, setShow] = useState(false);
  const [errorCount, setErrorCount] = useState(0);

  useEffect(() => {
    // 拦截 console.error 检测网络错误
    const originalError = console.error;
    let errorTimeout: NodeJS.Timeout | null = null;

    console.error = function(...args: any[]) {
      const errorMsg = args.join(' ');
      
      // 检测 Supabase/网络相关错误
      if (
        errorMsg.includes('Failed to fetch') ||
        errorMsg.includes('NetworkError') ||
        errorMsg.includes('Network error') ||
        errorMsg.includes('Supabase unreachable')
      ) {
        setErrorCount(prev => prev + 1);
        
        // 清除之前的超时
        if (errorTimeout) {
          clearTimeout(errorTimeout);
        }
        
        // 延迟显示，避免闪烁
        errorTimeout = setTimeout(() => {
          setShow(true);
        }, 1000);
      }
      
      // 调用原始的 console.error
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
      if (errorTimeout) {
        clearTimeout(errorTimeout);
      }
    };
  }, []);

  // 🧪 只在开发环境显示（生产环境永不显示）
  const isDevelopment = 
    window.location.hostname === 'localhost' ||
    window.location.hostname.includes('127.0.0.1') ||
    window.location.hostname.includes('preview');

  // 只在开发环境且有错误时显示
  if (!show || !isDevelopment || errorCount === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10000,
        maxWidth: '600px',
        width: '90%',
      }}
    >
      <div className="bg-red-50 border-2 border-red-400 rounded-lg shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
          
          <div className="flex-1">
            <h3 className="font-bold text-red-900 mb-2">
              🌐 网络错误：无法连接到 Supabase
            </h3>
            
            <p className="text-sm text-red-800 mb-3">
              在 Figma Make 开发环境中，Supabase 认证服务可能无法访问。
              这是正常的！
            </p>
            
            <div className="bg-yellow-50 border border-yellow-300 rounded p-3 mb-3">
              <p className="text-sm text-yellow-900 font-medium mb-2">
                💡 解决方法：
              </p>
              <ul className="text-sm text-yellow-800 space-y-1 ml-4 list-disc">
                <li>查看右下角的 <strong>🧪 开发模式</strong> 黄色卡片</li>
                <li>点击 <strong>"⚡ 快速登录"</strong> 按钮</li>
                <li>无需 Supabase 即可测试所有功能</li>
              </ul>
            </div>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  // 滚动到开发模式卡片
                  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                  setShow(false);
                }}
                className="text-xs"
              >
                查看开发模式 →
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShow(false)}
                className="text-xs"
              >
                我知道了
              </Button>
            </div>
          </div>
          
          <button
            onClick={() => setShow(false)}
            className="text-red-400 hover:text-red-600 flex-shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="mt-3 pt-3 border-t border-red-200">
          <p className="text-xs text-red-600">
            检测到 {errorCount} 个网络错误 · 这在开发环境中是正常的
          </p>
        </div>
      </div>
    </div>
  );
}