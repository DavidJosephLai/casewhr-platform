/**
 * 🔤 字体优化配置
 * 提供字体加载优化、预加载和回退策略
 */

/**
 * 字体配置
 */
export const fontConfig = {
  // 主要字体族
  families: {
    sans: [
      // 系统字体（优先级最高，无需加载）
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      // 中文字体
      'PingFang SC',
      'Microsoft YaHei',
      'STHeiti',
      'sans-serif',
    ],
    mono: [
      'ui-monospace',
      'SFMono-Regular',
      'SF Mono',
      'Menlo',
      'Consolas',
      'Liberation Mono',
      'monospace',
    ],
  },

  // 自定义字体（如果需要）
  custom: {
    // 示例：Google Fonts
    // 注意：使用系统字体更快，只在必要时使用自定义字体
    googleFonts: [
      // {
      //   name: 'Inter',
      //   weights: [400, 500, 600, 700],
      //   display: 'swap',
      // },
    ],
  },

  // 字体显示策略
  display: 'swap' as const, // 'auto' | 'block' | 'swap' | 'fallback' | 'optional'
};

/**
 * 生成字体族 CSS 字符串
 */
export function getFontFamilyCSS(type: 'sans' | 'mono' = 'sans'): string {
  return fontConfig.families[type].join(', ');
}

/**
 * 预加载字体
 * 仅在使用自定义 Web 字体时需要
 */
export function preloadFonts(fonts: Array<{ url: string; format: string }>) {
  fonts.forEach(font => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = `font/${font.format}`;
    link.href = font.url;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
    
    console.log('🔤 [Font] Preloading font:', font.url);
  });
}

/**
 * 生成 Google Fonts URL
 */
export function getGoogleFontsURL(fonts: Array<{ name: string; weights: number[] }>): string {
  if (fonts.length === 0) return '';

  const fontParams = fonts.map(font => {
    const weights = font.weights.join(';');
    return `family=${font.name}:wght@${weights}`;
  }).join('&');

  return `https://fonts.googleapis.com/css2?${fontParams}&display=swap`;
}

/**
 * 加载 Google Fonts
 */
export function loadGoogleFonts(fonts: Array<{ name: string; weights: number[] }>) {
  if (fonts.length === 0) return;

  const url = getGoogleFontsURL(fonts);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  document.head.appendChild(link);

  console.log('🔤 [Font] Loading Google Fonts:', fonts.map(f => f.name).join(', '));
}

/**
 * 字体加载状态检测
 */
export async function checkFontLoaded(fontFamily: string, timeout = 3000): Promise<boolean> {
  if (!('fonts' in document)) {
    console.warn('⚠️ [Font] Font Loading API not supported');
    return false;
  }

  try {
    await document.fonts.load(`1em ${fontFamily}`, '', { timeout });
    console.log(`✅ [Font] Font loaded: ${fontFamily}`);
    return true;
  } catch (error) {
    console.warn(`⚠️ [Font] Font loading timeout: ${fontFamily}`);
    return false;
  }
}

/**
 * 字体优化建议
 */
export const fontOptimizationTips = {
  // 使用系统字体（最快）
  useSystemFonts: {
    title: '使用系统字体',
    description: '系统字体无需下载，加载速度最快',
    example: `font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', ...`,
    benefit: '节省 20-50KB 下载，加快 200-500ms 加载',
  },

  // 字体子集化
  fontSubsetting: {
    title: '字体子集化',
    description: '只包含需要的字符，减小字体文件大小',
    tool: 'https://www.fontsquirrel.com/tools/webfont-generator',
    benefit: '减小 50-90% 字体文件大小',
  },

  // 使用 font-display: swap
  fontDisplay: {
    title: '使用 font-display: swap',
    description: '立即显示回退字体，字体加载完成后切换',
    example: `@font-face { font-display: swap; }`,
    benefit: '避免 FOIT（不可见文本闪烁）',
  },

  // 预加载关键字体
  preloadFonts: {
    title: '预加载关键字体',
    description: '提前加载首屏使用的字体',
    example: `<link rel="preload" as="font" href="/fonts/font.woff2" crossorigin>`,
    benefit: '减少 100-300ms 字体加载时间',
  },

  // 使用 WOFF2 格式
  useWOFF2: {
    title: '使用 WOFF2 格式',
    description: 'WOFF2 压缩率比 WOFF 高 30%',
    support: '支持 95%+ 的现代浏览器',
    benefit: '减小 30% 字体文件大小',
  },
};

/**
 * CSS 变量：字体族
 */
export const fontFamilyVariables = `
  :root {
    --font-sans: ${getFontFamilyCSS('sans')};
    --font-mono: ${getFontFamilyCSS('mono')};
  }
`;

/**
 * 字体性能监控
 */
export async function measureFontLoadTime(fontFamily: string): Promise<number> {
  if (!('fonts' in document)) {
    return 0;
  }

  const startTime = performance.now();
  
  try {
    await document.fonts.load(`1em ${fontFamily}`);
    const loadTime = performance.now() - startTime;
    console.log(`⏱️ [Font] ${fontFamily} loaded in ${loadTime.toFixed(2)}ms`);
    return loadTime;
  } catch (error) {
    console.error(`❌ [Font] Failed to load ${fontFamily}:`, error);
    return -1;
  }
}

/**
 * 获取所有已加载的字体
 */
export function getLoadedFonts(): string[] {
  if (!('fonts' in document)) {
    return [];
  }

  const loadedFonts: string[] = [];
  
  document.fonts.forEach((font) => {
    if (font.status === 'loaded') {
      loadedFonts.push(font.family);
    }
  });

  return loadedFonts;
}

/**
 * 字体加载进度监控
 */
export function monitorFontLoading(callback: (progress: number) => void) {
  if (!('fonts' in document)) {
    callback(100);
    return;
  }

  let loaded = 0;
  const total = document.fonts.size;

  if (total === 0) {
    callback(100);
    return;
  }

  document.fonts.forEach((font) => {
    if (font.status === 'loaded') {
      loaded++;
    }
  });

  const initialProgress = (loaded / total) * 100;
  callback(initialProgress);

  document.fonts.ready.then(() => {
    callback(100);
    console.log('✅ [Font] All fonts loaded');
  });
}

export default {
  config: fontConfig,
  getFontFamilyCSS,
  preloadFonts,
  getGoogleFontsURL,
  loadGoogleFonts,
  checkFontLoaded,
  measureFontLoadTime,
  getLoadedFonts,
  monitorFontLoading,
  optimizationTips: fontOptimizationTips,
};
