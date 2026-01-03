/**
 * 🖼️ 图片优化工具
 * 提供图片格式转换、压缩和优化功能
 */

/**
 * 检测浏览器是否支持 WebP
 */
export function supportsWebP(): Promise<boolean> {
  return new Promise((resolve) => {
    const webP = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';
    const img = new Image();
    
    img.onload = () => {
      resolve(img.width === 1 && img.height === 1);
    };
    
    img.onerror = () => {
      resolve(false);
    };
    
    img.src = webP;
  });
}

/**
 * 检测浏览器是否支持 AVIF
 */
export function supportsAVIF(): Promise<boolean> {
  return new Promise((resolve) => {
    const avif = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';
    const img = new Image();
    
    img.onload = () => {
      resolve(img.width === 2 && img.height === 2);
    };
    
    img.onerror = () => {
      resolve(false);
    };
    
    img.src = avif;
  });
}

// 缓存支持检测结果
let webpSupport: boolean | null = null;
let avifSupport: boolean | null = null;

/**
 * 获取支持的最佳图片格式
 */
export async function getBestImageFormat(): Promise<'avif' | 'webp' | 'jpeg'> {
  if (avifSupport === null) {
    avifSupport = await supportsAVIF();
  }
  
  if (avifSupport) {
    return 'avif';
  }
  
  if (webpSupport === null) {
    webpSupport = await supportsWebP();
  }
  
  if (webpSupport) {
    return 'webp';
  }
  
  return 'jpeg';
}

/**
 * 图片 URL 优化选项
 */
interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  dpr?: number;
}

/**
 * 优化 Unsplash 图片 URL
 */
export function optimizeUnsplashImage(
  url: string,
  options: ImageOptimizationOptions = {}
): string {
  const {
    width,
    height,
    quality = 80,
    format = 'auto',
    fit = 'crop',
  } = options;

  const params = new URLSearchParams();
  
  if (width) params.set('w', width.toString());
  if (height) params.set('h', height.toString());
  params.set('q', quality.toString());
  params.set('fit', fit);
  params.set('auto', 'format'); // 自动选择最佳格式
  
  if (format !== 'auto') {
    params.set('fm', format);
  }

  return `${url}?${params.toString()}`;
}

/**
 * 优化通用图片 URL（支持 Cloudinary、Imgix 等）
 */
export async function optimizeImageUrl(
  url: string,
  options: ImageOptimizationOptions = {}
): Promise<string> {
  const {
    width,
    height,
    quality = 80,
    format = 'auto',
    dpr = window.devicePixelRatio || 1,
  } = options;

  // 检测 URL 类型
  if (url.includes('unsplash.com') || url.includes('images.unsplash.com')) {
    return optimizeUnsplashImage(url, options);
  }

  // 如果是 Cloudinary
  if (url.includes('cloudinary.com')) {
    return optimizeCloudinaryImage(url, options);
  }

  // 如果是 Imgix
  if (url.includes('imgix.net')) {
    return optimizeImgixImage(url, options);
  }

  // 对于其他 URL，尝试添加通用参数
  const params = new URLSearchParams();
  
  if (width) params.set('w', (width * dpr).toString());
  if (height) params.set('h', (height * dpr).toString());
  params.set('q', quality.toString());
  
  if (format === 'auto') {
    const bestFormat = await getBestImageFormat();
    params.set('format', bestFormat);
  } else if (format !== 'auto') {
    params.set('format', format);
  }

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${params.toString()}`;
}

/**
 * 优化 Cloudinary 图片
 */
function optimizeCloudinaryImage(
  url: string,
  options: ImageOptimizationOptions
): string {
  const { width, height, quality = 80, format = 'auto' } = options;
  
  let transformations = [];
  
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  transformations.push(`q_${quality}`);
  
  if (format === 'auto') {
    transformations.push('f_auto');
  } else if (format !== 'auto') {
    transformations.push(`f_${format}`);
  }
  
  const transformString = transformations.join(',');
  
  // 在 upload/ 后插入转换参数
  return url.replace(/\/upload\//, `/upload/${transformString}/`);
}

/**
 * 优化 Imgix 图片
 */
function optimizeImgixImage(
  url: string,
  options: ImageOptimizationOptions
): string {
  const { width, height, quality = 80, format = 'auto', fit = 'crop' } = options;
  
  const params = new URLSearchParams();
  
  if (width) params.set('w', width.toString());
  if (height) params.set('h', height.toString());
  params.set('q', quality.toString());
  params.set('fit', fit);
  
  if (format === 'auto') {
    params.set('auto', 'format');
  } else if (format !== 'auto') {
    params.set('fm', format);
  }
  
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${params.toString()}`;
}

/**
 * 生成响应式图片 srcset
 */
export function generateSrcSet(
  baseUrl: string,
  widths: number[] = [320, 640, 768, 1024, 1280, 1536]
): string {
  return widths
    .map((width) => {
      const optimizedUrl = optimizeUnsplashImage(baseUrl, { width });
      return `${optimizedUrl} ${width}w`;
    })
    .join(', ');
}

/**
 * 生成 sizes 属性
 */
export function generateSizes(breakpoints: Array<{ maxWidth: string; size: string }>): string {
  return breakpoints
    .map(({ maxWidth, size }) => `(max-width: ${maxWidth}) ${size}`)
    .join(', ');
}

/**
 * 将图片转换为 WebP
 */
export async function convertToWebP(
  imageFile: File,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert image to WebP'));
            }
          },
          'image/webp',
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(imageFile);
  });
}

/**
 * 压缩图片
 */
export async function compressImage(
  imageFile: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        let { width, height } = img;
        
        // 计算缩放比例
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          imageFile.type,
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(imageFile);
  });
}

/**
 * 获取图片尺寸
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * 图片优化建议
 */
export const imageOptimizationTips = {
  formats: {
    avif: {
      name: 'AVIF',
      savings: '50-60% smaller than JPEG',
      support: '60%+ browsers',
      recommendation: '最佳选择（如果支持）',
    },
    webp: {
      name: 'WebP',
      savings: '25-35% smaller than JPEG',
      support: '95%+ browsers',
      recommendation: '推荐使用',
    },
    jpeg: {
      name: 'JPEG',
      savings: 'baseline',
      support: '100% browsers',
      recommendation: '回退选项',
    },
  },
  
  sizes: {
    thumbnail: { width: 150, height: 150, quality: 70 },
    small: { width: 320, height: 240, quality: 75 },
    medium: { width: 640, height: 480, quality: 80 },
    large: { width: 1024, height: 768, quality: 85 },
    xlarge: { width: 1920, height: 1080, quality: 85 },
  },
  
  responsive: {
    mobile: [320, 640],
    tablet: [768, 1024],
    desktop: [1280, 1536, 1920],
  },
};

export default {
  supportsWebP,
  supportsAVIF,
  getBestImageFormat,
  optimizeImageUrl,
  optimizeUnsplashImage,
  generateSrcSet,
  generateSizes,
  convertToWebP,
  compressImage,
  getImageDimensions,
  tips: imageOptimizationTips,
};
