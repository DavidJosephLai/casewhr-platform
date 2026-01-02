/**
 * 🖼️ 图片懒加载 Hook
 * 使用 Intersection Observer API 实现高性能图片懒加载
 */

import { useEffect, useRef, useState, useCallback } from 'react';

interface UseImageLazyLoadOptions {
  rootMargin?: string;
  threshold?: number;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * 图片懒加载 Hook
 * 
 * @example
 * ```tsx
 * const { ref, imageSrc, isLoaded, hasError } = useImageLazyLoad({
 *   src: 'https://example.com/image.jpg',
 *   placeholder: '/placeholder.png',
 *   rootMargin: '50px',
 * });
 * 
 * return (
 *   <img 
 *     ref={ref} 
 *     src={imageSrc} 
 *     alt="描述"
 *     className={isLoaded ? 'loaded' : 'loading'}
 *   />
 * );
 * ```
 */
export function useImageLazyLoad(
  src: string,
  options: UseImageLazyLoadOptions = {}
) {
  const {
    rootMargin = '50px',
    threshold = 0.01,
    placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23f0f0f0"/%3E%3C/svg%3E',
    onLoad,
    onError,
  } = options;

  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!imgRef.current || !src) return;

    // 创建 Intersection Observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            console.log('🖼️ [ImageLazyLoad] Image entering viewport, loading:', src);
            
            // 创建新的 Image 对象来预加载
            const img = new Image();
            
            img.onload = () => {
              console.log('✅ [ImageLazyLoad] Image loaded:', src);
              setImageSrc(src);
              setIsLoaded(true);
              onLoad?.();
              
              // 停止观察
              if (observerRef.current && imgRef.current) {
                observerRef.current.unobserve(imgRef.current);
              }
            };
            
            img.onerror = () => {
              console.error('❌ [ImageLazyLoad] Image failed to load:', src);
              setHasError(true);
              onError?.();
              
              // 停止观察
              if (observerRef.current && imgRef.current) {
                observerRef.current.unobserve(imgRef.current);
              }
            };
            
            img.src = src;
          }
        });
      },
      {
        rootMargin,
        threshold,
      }
    );

    // 开始观察
    observerRef.current.observe(imgRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [src, rootMargin, threshold, onLoad, onError]);

  return {
    ref: imgRef,
    imageSrc,
    isLoaded,
    hasError,
  };
}

/**
 * 批量图片懒加载 Hook
 * 适用于图片列表场景
 * 
 * @example
 * ```tsx
 * const { refs, loadedImages } = useImageListLazyLoad(imageUrls);
 * 
 * return imageUrls.map((url, index) => (
 *   <img 
 *     key={url}
 *     ref={refs[index]} 
 *     src={loadedImages[url] || placeholder}
 *     alt={`Image ${index}`}
 *   />
 * ));
 * ```
 */
export function useImageListLazyLoad(
  imageUrls: string[],
  options: UseImageLazyLoadOptions = {}
) {
  const [loadedImages, setLoadedImages] = useState<Record<string, string>>({});
  const refs = useRef<(HTMLElement | null)[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const {
    rootMargin = '50px',
    threshold = 0.01,
    placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23f0f0f0"/%3E%3C/svg%3E',
  } = options;

  useEffect(() => {
    // 创建 Intersection Observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            
            if (!src || loadedImages[src]) return;

            console.log('🖼️ [ImageListLazyLoad] Loading image:', src);

            const image = new Image();
            image.onload = () => {
              setLoadedImages((prev) => ({ ...prev, [src]: src }));
              img.src = src;
              observerRef.current?.unobserve(img);
            };
            image.onerror = () => {
              console.error('❌ [ImageListLazyLoad] Failed to load:', src);
              observerRef.current?.unobserve(img);
            };
            image.src = src;
          }
        });
      },
      {
        rootMargin,
        threshold,
      }
    );

    // 观察所有图片
    refs.current.forEach((ref) => {
      if (ref) {
        observerRef.current?.observe(ref);
      }
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [imageUrls, loadedImages, rootMargin, threshold]);

  const setRef = useCallback((index: number) => (el: HTMLElement | null) => {
    refs.current[index] = el;
  }, []);

  return {
    refs: refs.current,
    setRef,
    loadedImages,
    placeholder,
  };
}

/**
 * 背景图片懒加载 Hook
 * 用于背景图片的懒加载
 * 
 * @example
 * ```tsx
 * const ref = useBackgroundImageLazyLoad('https://example.com/bg.jpg');
 * 
 * return <div ref={ref} className="hero-section" />;
 * ```
 */
export function useBackgroundImageLazyLoad(
  imageUrl: string,
  options: UseImageLazyLoadOptions = {}
) {
  const ref = useRef<HTMLElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const {
    rootMargin = '50px',
    threshold = 0.01,
    onLoad,
  } = options;

  useEffect(() => {
    if (!ref.current || !imageUrl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            console.log('🖼️ [BackgroundImageLazyLoad] Loading:', imageUrl);
            
            const img = new Image();
            img.onload = () => {
              if (ref.current) {
                ref.current.style.backgroundImage = `url(${imageUrl})`;
                setIsLoaded(true);
                onLoad?.();
              }
              observer.unobserve(entry.target);
            };
            img.src = imageUrl;
          }
        });
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [imageUrl, rootMargin, threshold, onLoad]);

  return { ref, isLoaded };
}

/**
 * 响应式图片懒加载 Hook
 * 根据屏幕尺寸选择合适的图片
 * 
 * @example
 * ```tsx
 * const { ref, imageSrc, isLoaded } = useResponsiveImageLazyLoad({
 *   mobile: 'https://example.com/mobile.jpg',
 *   tablet: 'https://example.com/tablet.jpg',
 *   desktop: 'https://example.com/desktop.jpg',
 * });
 * 
 * return <img ref={ref} src={imageSrc} alt="Responsive" />;
 * ```
 */
export function useResponsiveImageLazyLoad(
  sources: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  },
  options: UseImageLazyLoadOptions = {}
) {
  const [currentSrc, setCurrentSrc] = useState<string>('');

  useEffect(() => {
    const updateSource = () => {
      const width = window.innerWidth;
      
      if (width < 768 && sources.mobile) {
        setCurrentSrc(sources.mobile);
      } else if (width < 1024 && sources.tablet) {
        setCurrentSrc(sources.tablet);
      } else if (sources.desktop) {
        setCurrentSrc(sources.desktop);
      }
    };

    updateSource();
    window.addEventListener('resize', updateSource);

    return () => {
      window.removeEventListener('resize', updateSource);
    };
  }, [sources]);

  const lazyLoadResult = useImageLazyLoad(currentSrc, options);

  return {
    ...lazyLoadResult,
    currentSrc,
  };
}

export default useImageLazyLoad;
