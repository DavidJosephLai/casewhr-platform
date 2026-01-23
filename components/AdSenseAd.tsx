/**
 * 💰 Google AdSense 廣告組件
 * 用於在網站各處插入 AdSense 廣告單元
 */

import { useEffect, useRef } from 'react';

interface AdSenseAdProps {
  /**
   * 廣告位置標識（用於追蹤）
   */
  slot: string;
  
  /**
   * 廣告格式
   * - 'auto': 自適應廣告（推薦）
   * - 'rectangle': 矩形廣告
   * - 'horizontal': 橫幅廣告
   * - 'vertical': 垂直廣告
   */
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  
  /**
   * 是否響應式廣告（推薦開啟）
   */
  responsive?: boolean;
  
  /**
   * 自定義樣式
   */
  style?: React.CSSProperties;
  
  /**
   * 自定義 class
   */
  className?: string;
}

export function AdSenseAd({ 
  slot, 
  format = 'auto', 
  responsive = true,
  style,
  className = ''
}: AdSenseAdProps) {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    try {
      // 確保 adsbygoogle 已載入
      if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
        // 推送廣告到 AdSense
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        console.log('✅ [AdSense] Ad loaded successfully for slot:', slot);
      } else {
        console.warn('⚠️ [AdSense] adsbygoogle not loaded yet');
      }
    } catch (error) {
      console.error('❌ [AdSense] Error loading ad:', error);
    }
  }, [slot]);

  return (
    <div className={`adsense-container my-6 ${className}`} style={style}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', textAlign: 'center' }}
        data-ad-client="ca-pub-6166817683886046"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
}

/**
 * 🎯 預設義的廣告位置組件
 */

// 文章頂部廣告（橫幅）
export function ArticleTopAd() {
  return (
    <AdSenseAd 
      slot="1234567890" // TODO: 替換為實際的廣告位 ID
      format="horizontal"
      className="article-top-ad border-b pb-6 mb-6"
    />
  );
}

// 文章中間廣告（矩形）
export function ArticleMiddleAd() {
  return (
    <AdSenseAd 
      slot="2345678901" // TODO: 替換為實際的廣告位 ID
      format="rectangle"
      className="article-middle-ad my-8 p-4 bg-gray-50 rounded-lg border"
    />
  );
}

// 文章底部廣告（自適應）
export function ArticleBottomAd() {
  return (
    <AdSenseAd 
      slot="3456789012" // TODO: 替換為實際的廣告位 ID
      format="auto"
      className="article-bottom-ad border-t pt-6 mt-6"
    />
  );
}

// 側邊欄廣告（垂直）
export function SidebarAd() {
  return (
    <AdSenseAd 
      slot="4567890123" // TODO: 替換為實際的廣告位 ID
      format="vertical"
      className="sidebar-ad sticky top-20"
    />
  );
}
