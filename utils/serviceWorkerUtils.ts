/**
 * 🔧 Service Worker 注册和管理工具
 * 提供 Service Worker 的注册、更新、卸载等功能
 */

interface ServiceWorkerConfig {
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

/**
 * 注册 Service Worker
 */
export async function registerServiceWorker(config: ServiceWorkerConfig = {}) {
  // 检查浏览器是否支持 Service Worker
  if (!('serviceWorker' in navigator)) {
    console.warn('⚠️ [SW] Service Worker not supported in this browser');
    return null;
  }

  // 开发环境下可选择禁用
  if (import.meta.env.DEV && import.meta.env.VITE_DISABLE_SW === 'true') {
    console.log('🔧 [SW] Service Worker disabled in development mode');
    return null;
  }

  try {
    console.log('🔧 [SW] Registering Service Worker...');
    
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
    });

    console.log('✅ [SW] Service Worker registered:', registration.scope);

    // 检查更新
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      
      if (!newWorker) return;

      console.log('🔄 [SW] New Service Worker found, installing...');

      newWorker.addEventListener('statechange', () => {
        console.log('🔧 [SW] Service Worker state changed:', newWorker.state);

        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // 有新版本的 Service Worker 可用
          console.log('✨ [SW] New Service Worker available');
          config.onUpdate?.(registration);
        } else if (newWorker.state === 'activated') {
          // Service Worker 已激活
          console.log('✅ [SW] Service Worker activated');
          config.onSuccess?.(registration);
        }
      });
    });

    // 自动检查更新（每小时一次）
    setInterval(() => {
      registration.update().catch((error) => {
        console.error('❌ [SW] Failed to check for updates:', error);
      });
    }, 60 * 60 * 1000); // 1 hour

    return registration;
  } catch (error) {
    console.error('❌ [SW] Service Worker registration failed:', error);
    config.onError?.(error as Error);
    return null;
  }
}

/**
 * 卸载 Service Worker
 */
export async function unregisterServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const success = await registration.unregister();
    
    if (success) {
      console.log('✅ [SW] Service Worker unregistered');
    } else {
      console.warn('⚠️ [SW] Failed to unregister Service Worker');
    }
    
    return success;
  } catch (error) {
    console.error('❌ [SW] Error unregistering Service Worker:', error);
    return false;
  }
}

/**
 * 清除所有缓存
 */
export async function clearAllCaches() {
  if (!('caches' in window)) {
    console.warn('⚠️ [SW] Cache API not supported');
    return false;
  }

  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
    console.log('✅ [SW] All caches cleared');
    return true;
  } catch (error) {
    console.error('❌ [SW] Error clearing caches:', error);
    return false;
  }
}

/**
 * 获取缓存大小
 */
export async function getCacheSize(): Promise<number> {
  if (!('caches' in window)) {
    return 0;
  }

  try {
    const cacheNames = await caches.keys();
    let totalSize = 0;

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();

      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }
    }

    return totalSize;
  } catch (error) {
    console.error('❌ [SW] Error calculating cache size:', error);
    return 0;
  }
}

/**
 * 格式化缓存大小
 */
export function formatCacheSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}

/**
 * 跳过等待并激活新的 Service Worker
 */
export async function skipWaitingAndActivate() {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    if (registration.waiting) {
      // 发送消息给等待中的 Service Worker
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // 等待控制器变更
      return new Promise<boolean>((resolve) => {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('✅ [SW] Controller changed, reloading...');
          resolve(true);
        });
      });
    }
    
    return false;
  } catch (error) {
    console.error('❌ [SW] Error skipping waiting:', error);
    return false;
  }
}

/**
 * 检查是否有新版本的 Service Worker
 */
export async function checkForUpdates() {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    
    return !!registration.waiting;
  } catch (error) {
    console.error('❌ [SW] Error checking for updates:', error);
    return false;
  }
}

/**
 * 获取 Service Worker 状态
 */
export async function getServiceWorkerStatus() {
  if (!('serviceWorker' in navigator)) {
    return {
      supported: false,
      registered: false,
      controller: null,
      waiting: null,
    };
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    
    return {
      supported: true,
      registered: !!registration,
      controller: navigator.serviceWorker.controller,
      waiting: registration?.waiting || null,
      active: registration?.active || null,
      installing: registration?.installing || null,
    };
  } catch (error) {
    console.error('❌ [SW] Error getting status:', error);
    return {
      supported: true,
      registered: false,
      controller: null,
      waiting: null,
    };
  }
}

/**
 * 预缓存资源
 */
export async function precacheResources(urls: string[]) {
  if (!('caches' in window)) {
    console.warn('⚠️ [SW] Cache API not supported');
    return false;
  }

  try {
    const cache = await caches.open('casewhr-v1.0.0-precache');
    await cache.addAll(urls);
    console.log('✅ [SW] Resources precached:', urls.length);
    return true;
  } catch (error) {
    console.error('❌ [SW] Error precaching resources:', error);
    return false;
  }
}

export default {
  register: registerServiceWorker,
  unregister: unregisterServiceWorker,
  clearCaches: clearAllCaches,
  getCacheSize,
  formatCacheSize,
  skipWaitingAndActivate,
  checkForUpdates,
  getStatus: getServiceWorkerStatus,
  precacheResources,
};
