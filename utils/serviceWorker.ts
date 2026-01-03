/**
 * 🔧 Service Worker 註冊和管理工具
 * Version: 2.5.2
 */

export interface ServiceWorkerStatus {
  isSupported: boolean;
  isRegistered: boolean;
  isActive: boolean;
  waiting: ServiceWorker | null;
  active: ServiceWorker | null;
  installing: ServiceWorker | null;
}

/**
 * 註冊 Service Worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('⚠️ [SW] Service Worker not supported in this browser');
    return null;
  }

  try {
    console.log('🔧 [SW] Registering Service Worker...');
    
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
    });

    console.log('✅ [SW] Service Worker registered successfully:', registration);

    // 監聽更新
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      console.log('🆕 [SW] New Service Worker found, installing...');

      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('🔄 [SW] New Service Worker installed, update available');
            
            // 通知用戶有更新
            window.dispatchEvent(new CustomEvent('swUpdateAvailable', {
              detail: { registration }
            }));
          }
        });
      }
    });

    // 定期檢查更新 (每小時)
    setInterval(() => {
      registration.update();
      console.log('🔄 [SW] Checking for updates...');
    }, 60 * 60 * 1000);

    return registration;
  } catch (error) {
    console.error('❌ [SW] Service Worker registration failed:', error);
    return null;
  }
}

/**
 * 註銷 Service Worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    
    if (registration) {
      const success = await registration.unregister();
      console.log(success ? '✅ [SW] Unregistered' : '❌ [SW] Unregister failed');
      return success;
    }
    
    return false;
  } catch (error) {
    console.error('❌ [SW] Unregister failed:', error);
    return false;
  }
}

/**
 * 清除所有緩存
 */
export async function clearAllCaches(): Promise<void> {
  if (!('caches' in window)) {
    console.warn('⚠️ [SW] Cache API not supported');
    return;
  }

  try {
    const cacheNames = await caches.keys();
    console.log('🗑️ [SW] Clearing caches:', cacheNames);
    
    await Promise.all(
      cacheNames.map((cacheName) => caches.delete(cacheName))
    );
    
    console.log('✅ [SW] All caches cleared');
  } catch (error) {
    console.error('❌ [SW] Failed to clear caches:', error);
  }
}

/**
 * 獲取緩存大小
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
      const keys = await cache.keys();

      for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }
    }

    return totalSize;
  } catch (error) {
    console.error('❌ [SW] Failed to calculate cache size:', error);
    return 0;
  }
}

/**
 * 格式化緩存大小
 */
export function formatCacheSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * 跳過等待並激活新的 Service Worker
 */
export async function skipWaitingAndActivate(): Promise<void> {
  const registration = await navigator.serviceWorker.getRegistration();
  
  if (registration && registration.waiting) {
    console.log('⏭️ [SW] Skipping waiting and activating new Service Worker');
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    
    // 刷新頁面以使用新的 Service Worker
    window.location.reload();
  }
}

/**
 * 檢查更新
 */
export async function checkForUpdates(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    
    if (registration) {
      await registration.update();
      console.log('🔄 [SW] Update check completed');
      return !!registration.waiting;
    }
    
    return false;
  } catch (error) {
    console.error('❌ [SW] Update check failed:', error);
    return false;
  }
}

/**
 * 獲取 Service Worker 狀態
 */
export async function getServiceWorkerStatus(): Promise<ServiceWorkerStatus> {
  const isSupported = 'serviceWorker' in navigator;
  
  if (!isSupported) {
    return {
      isSupported: false,
      isRegistered: false,
      isActive: false,
      waiting: null,
      active: null,
      installing: null,
    };
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    
    if (!registration) {
      return {
        isSupported: true,
        isRegistered: false,
        isActive: false,
        waiting: null,
        active: null,
        installing: null,
      };
    }

    return {
      isSupported: true,
      isRegistered: true,
      isActive: !!registration.active,
      waiting: registration.waiting,
      active: registration.active,
      installing: registration.installing,
    };
  } catch (error) {
    console.error('❌ [SW] Failed to get status:', error);
    return {
      isSupported: true,
      isRegistered: false,
      isActive: false,
      waiting: null,
      active: null,
      installing: null,
    };
  }
}

/**
 * 在頁面載入時自動註冊 Service Worker
 */
export function autoRegisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      registerServiceWorker();
    });
  }
}
