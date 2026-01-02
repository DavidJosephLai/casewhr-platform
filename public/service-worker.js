/**
 * 🔧 Case Where Platform Service Worker
 * Version: 2.5.2
 * 提供離線訪問、靜態資源緩存、API 響應緩存
 */

const CACHE_VERSION = 'casewhr-v2.5.2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// 需要緩存的靜態資源
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles/globals.css',
  '/manifest.json',
];

// API 緩存策略：stale-while-revalidate
const API_CACHE_PATTERNS = [
  /\/functions\/v1\/make-server-215f78a5\/exchange-rate/,
  /\/functions\/v1\/make-server-215f78a5\/subscription/,
];

// 圖片緩存模式
const IMAGE_PATTERNS = [
  /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/,
  /figma:asset/,
];

// ============================================
// 📦 INSTALL - 安裝階段
// ============================================
self.addEventListener('install', (event) => {
  console.log('🔧 [SW] Installing Service Worker v' + CACHE_VERSION);
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 [SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ [SW] Static assets cached successfully');
        return self.skipWaiting(); // 立即激活新的 Service Worker
      })
      .catch((error) => {
        console.error('❌ [SW] Failed to cache static assets:', error);
      })
  );
});

// ============================================
// 🔄 ACTIVATE - 激活階段
// ============================================
self.addEventListener('activate', (event) => {
  console.log('🔄 [SW] Activating Service Worker v' + CACHE_VERSION);
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        // 刪除舊版本緩存
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith('casewhr-') && !cacheName.startsWith(CACHE_VERSION)) {
              console.log('🗑️ [SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ [SW] Service Worker activated successfully');
        return self.clients.claim(); // 立即控制所有頁面
      })
  );
});

// ============================================
// 🌐 FETCH - 請求攔截
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 跳過 chrome-extension 和非 http(s) 請求
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // 🖼️ 圖片請求：Cache First (優先使用緩存)
  if (isImageRequest(request)) {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
    return;
  }

  // 🔌 API 請求：Stale While Revalidate (使用緩存同時更新)
  if (isAPIRequest(request)) {
    event.respondWith(staleWhileRevalidateStrategy(request, API_CACHE));
    return;
  }

  // 📄 靜態資源：Network First (優先網絡)
  event.respondWith(networkFirstStrategy(request, STATIC_CACHE));
});

// ============================================
// 📡 策略 1: Cache First (圖片)
// ============================================
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cached = await caches.match(request);
    if (cached) {
      console.log('✅ [SW] Cache hit:', request.url);
      return cached;
    }

    console.log('🌐 [SW] Cache miss, fetching:', request.url);
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('❌ [SW] Cache First failed:', error);
    return new Response('Offline - Image not available', { status: 503 });
  }
}

// ============================================
// 🔄 策略 2: Stale While Revalidate (API)
// ============================================
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // 在後台更新緩存
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch((error) => {
      console.error('❌ [SW] Network request failed:', error);
      return cached; // 網絡失敗時返回緩存
    });

  // 如果有緩存，立即返回；否則等待網絡
  return cached || fetchPromise;
}

// ============================================
// 🌐 策略 3: Network First (靜態資源)
// ============================================
async function networkFirstStrategy(request, cacheName) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('🌐 [SW] Network failed, trying cache:', request.url);
    const cached = await caches.match(request);
    
    if (cached) {
      return cached;
    }
    
    // 離線時返回基本的 HTML
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match('/');
      if (offlineResponse) {
        return offlineResponse;
      }
    }
    
    return new Response('Offline - Resource not available', { 
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// ============================================
// 🔍 輔助函數
// ============================================
function isImageRequest(request) {
  return IMAGE_PATTERNS.some(pattern => pattern.test(request.url));
}

function isAPIRequest(request) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(request.url));
}

// ============================================
// 💬 消息處理
// ============================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('⏭️ [SW] Skip waiting requested');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('🗑️ [SW] Clear cache requested');
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

// ============================================
// 🔔 後台同步 (如果支持)
// ============================================
if ('sync' in self.registration) {
  self.addEventListener('sync', (event) => {
    console.log('🔄 [SW] Background sync triggered:', event.tag);
    
    if (event.tag === 'sync-data') {
      event.waitUntil(syncData());
    }
  });
}

async function syncData() {
  console.log('🔄 [SW] Syncing data...');
  // 這裡可以實現離線數據同步邏輯
}

console.log('🚀 [SW] Service Worker script loaded');
