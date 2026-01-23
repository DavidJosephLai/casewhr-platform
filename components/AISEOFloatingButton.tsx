import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useView } from '../contexts/ViewContext';
import { useAuth } from '../contexts/AuthContext';
import { isAnyAdmin } from '../config/admin'; // ✅ 使用統一的管理員配置

/**
 * AI SEO 浮動按鈕
 * 管理員可快速訪問 AI SEO 管理器
 */
export function AISEOFloatingButton() {
  const { setView } = useView();
  const { user, profile } = useAuth(); // ✅ 同時獲取 user 和 profile
  const [isHovered, setIsHovered] = useState(false);

  // ✅ 只顯示給已登入的管理員
  if (!user || !isAnyAdmin(user?.email, profile)) {
    return null;
  }

  const handleClick = () => {
    setView('ai-seo');
  };

  return (
    <div className="fixed bottom-24 right-6 z-40">
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
        title="AI SEO Manager"
      >
        <Sparkles className="w-6 h-6 animate-pulse" />
        
        {/* Tooltip */}
        {isHovered && (
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap shadow-lg">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>AI SEO Manager</span>
            </div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rotate-45 w-2 h-2 bg-gray-900" />
          </div>
        )}

        {/* Pulse animation */}
        <div className="absolute inset-0 rounded-full bg-purple-600 opacity-75 animate-ping" />
      </button>
    </div>
  );
}