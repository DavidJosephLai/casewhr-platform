/**
 * 🖼️ 懒加载图片组件
 * 封装好的图片懒加载组件，开箱即用
 */

import React from 'react';
import useImageLazyLoad from '../hooks/useImageLazyLoad';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  rootMargin?: string;
  threshold?: number;
  onLoad?: () => void;
  onError?: () => void;
  loadingClassName?: string;
  loadedClassName?: string;
  errorClassName?: string;
}

/**
 * 懒加载图片组件
 * 
 * @example
 * ```tsx
 * <LazyImage 
 *   src="https://example.com/image.jpg"
 *   alt="描述"
 *   className="w-full h-auto"
 *   placeholder="/placeholder.png"
 * />
 * ```
 */
export function LazyImage({
  src,
  alt,
  placeholder,
  rootMargin,
  threshold,
  onLoad,
  onError,
  className = '',
  loadingClassName = 'opacity-50 blur-sm',
  loadedClassName = 'opacity-100 blur-0 transition-all duration-300',
  errorClassName = 'opacity-50',
  ...props
}: LazyImageProps) {
  const { ref, imageSrc, isLoaded, hasError } = useImageLazyLoad(src, {
    placeholder,
    rootMargin,
    threshold,
    onLoad,
    onError,
  });

  const imageClassName = `${className} ${
    hasError
      ? errorClassName
      : isLoaded
      ? loadedClassName
      : loadingClassName
  }`;

  return (
    <img
      ref={ref}
      src={imageSrc}
      alt={alt}
      className={imageClassName}
      {...props}
    />
  );
}

interface LazyBackgroundImageProps extends React.HTMLAttributes<HTMLDivElement> {
  imageUrl: string;
  rootMargin?: string;
  threshold?: number;
  onLoad?: () => void;
  loadingClassName?: string;
  loadedClassName?: string;
}

/**
 * 懒加载背景图片组件
 * 
 * @example
 * ```tsx
 * <LazyBackgroundImage 
 *   imageUrl="https://example.com/bg.jpg"
 *   className="h-96 bg-cover bg-center"
 * />
 * ```
 */
export function LazyBackgroundImage({
  imageUrl,
  rootMargin,
  threshold,
  onLoad,
  className = '',
  loadingClassName = 'bg-gray-200 animate-pulse',
  loadedClassName = 'transition-all duration-500',
  children,
  ...props
}: LazyBackgroundImageProps) {
  const { ref, isLoaded } = useImageLazyLoad(imageUrl, {
    rootMargin,
    threshold,
    onLoad,
  });

  const bgClassName = `${className} ${
    isLoaded ? loadedClassName : loadingClassName
  }`;

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={bgClassName}
      style={isLoaded ? { backgroundImage: `url(${imageUrl})` } : undefined}
      {...props}
    >
      {children}
    </div>
  );
}

interface ProgressiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  lowQualitySrc?: string;
  placeholder?: string;
}

/**
 * 渐进式图片加载组件
 * 先显示低质量图片，再加载高质量图片
 * 
 * @example
 * ```tsx
 * <ProgressiveImage 
 *   src="https://example.com/hq-image.jpg"
 *   lowQualitySrc="https://example.com/lq-image.jpg"
 *   alt="描述"
 * />
 * ```
 */
export function ProgressiveImage({
  src,
  alt,
  lowQualitySrc,
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23f0f0f0"/%3E%3C/svg%3E',
  className = '',
  ...props
}: ProgressiveImageProps) {
  const [currentSrc, setCurrentSrc] = React.useState(lowQualitySrc || placeholder);
  const [isHighQualityLoaded, setIsHighQualityLoaded] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);

  React.useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // 先加载低质量图片
            if (lowQualitySrc && currentSrc === placeholder) {
              const lowQualityImg = new Image();
              lowQualityImg.onload = () => {
                setCurrentSrc(lowQualitySrc);
                
                // 然后加载高质量图片
                const highQualityImg = new Image();
                highQualityImg.onload = () => {
                  setCurrentSrc(src);
                  setIsHighQualityLoaded(true);
                };
                highQualityImg.src = src;
              };
              lowQualityImg.src = lowQualitySrc;
            } else {
              // 直接加载高质量图片
              const highQualityImg = new Image();
              highQualityImg.onload = () => {
                setCurrentSrc(src);
                setIsHighQualityLoaded(true);
              };
              highQualityImg.src = src;
            }
            
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.01,
      }
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, [src, lowQualitySrc, placeholder, currentSrc]);

  return (
    <img
      ref={imgRef}
      src={currentSrc}
      alt={alt}
      className={`${className} ${
        isHighQualityLoaded
          ? 'opacity-100 blur-0'
          : 'opacity-75 blur-sm'
      } transition-all duration-500`}
      {...props}
    />
  );
}

interface ResponsiveImageProps {
  sources: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
  alt: string;
  className?: string;
  placeholder?: string;
}

/**
 * 响应式懒加载图片组件
 * 根据屏幕尺寸加载不同的图片
 * 
 * @example
 * ```tsx
 * <ResponsiveImage 
 *   sources={{
 *     mobile: '/mobile.jpg',
 *     tablet: '/tablet.jpg',
 *     desktop: '/desktop.jpg',
 *   }}
 *   alt="响应式图片"
 * />
 * ```
 */
export function ResponsiveImage({
  sources,
  alt,
  className = '',
  placeholder,
}: ResponsiveImageProps) {
  const [currentSrc, setCurrentSrc] = React.useState<string>('');

  React.useEffect(() => {
    const updateSource = () => {
      const width = window.innerWidth;
      
      if (width < 768 && sources.mobile) {
        setCurrentSrc(sources.mobile);
      } else if (width < 1024 && sources.tablet) {
        setCurrentSrc(sources.tablet || sources.mobile || '');
      } else {
        setCurrentSrc(sources.desktop || sources.tablet || sources.mobile || '');
      }
    };

    updateSource();
    window.addEventListener('resize', updateSource);

    return () => {
      window.removeEventListener('resize', updateSource);
    };
  }, [sources]);

  return (
    <LazyImage
      src={currentSrc}
      alt={alt}
      className={className}
      placeholder={placeholder}
    />
  );
}

export default LazyImage;
