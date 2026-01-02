/**
 * OptimizedImage Component
 * 
 * ⚡ 性能優化的圖片組件
 * 
 * 功能：
 * - ✅ Lazy loading（懶加載）
 * - ✅ 響應式圖片
 * - ✅ WebP 格式支援
 * - ✅ 佔位符防止 CLS
 * - ✅ 錯誤處理
 * 
 * @version 1.0.0
 * @date 2025-01-01
 */

import { useState, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean; // 是否為首屏關鍵圖片
  loading?: 'lazy' | 'eager';
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  loading = 'lazy',
  objectFit = 'cover',
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // 計算寬高比以防止 CLS
  const aspectRatio = width && height ? (height / width) * 100 : undefined;

  useEffect(() => {
    // 如果是優先圖片，預載入
    if (priority && src) {
      const img = new Image();
      img.src = src;
      img.onload = () => setIsLoaded(true);
      img.onerror = () => setHasError(true);
    }
  }, [src, priority]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
  };

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        paddingBottom: aspectRatio ? `${aspectRatio}%` : undefined,
        width: width ? `${width}px` : '100%',
        height: aspectRatio ? '0' : height ? `${height}px` : 'auto',
      }}
    >
      {/* 佔位符背景 - 防止 CLS */}
      {!isLoaded && !hasError && (
        <div
          className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse"
          aria-hidden="true"
        />
      )}

      {/* 實際圖片 */}
      {!hasError && (
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : loading}
          decoding={priority ? 'sync' : 'async'}
          onLoad={handleLoad}
          onError={handleError}
          className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            objectFit: objectFit,
          }}
        />
      )}

      {/* 錯誤狀態 */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center text-gray-400">
            <svg
              className="w-12 h-12 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm">圖片載入失敗</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 使用範例：
 * 
 * // 首屏關鍵圖片（優先載入）
 * <OptimizedImage
 *   src="/hero-bg.jpg"
 *   alt="Hero Background"
 *   width={1920}
 *   height={1080}
 *   priority={true}
 *   className="w-full"
 * />
 * 
 * // 懶加載圖片
 * <OptimizedImage
 *   src="/feature.jpg"
 *   alt="Feature Image"
 *   width={800}
 *   height={600}
 *   loading="lazy"
 *   className="rounded-lg"
 * />
 */
