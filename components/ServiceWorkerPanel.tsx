/**
 * 🔧 Service Worker 管理面板
 * 用于管理和监控 Service Worker 状态
 */

import { useState, useEffect } from 'react';
import { RefreshCw, Trash2, Download, Info, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
// import {
//   registerServiceWorker,
//   unregisterServiceWorker,
//   clearAllCaches,
//   getCacheSize,
//   formatCacheSize,
//   skipWaitingAndActivate,
//   checkForUpdates,
//   getServiceWorkerStatus,
// } from '../utils/serviceWorker';
import { toast } from 'sonner';

export function ServiceWorkerPanel() {
  const [status, setStatus] = useState<any>(null);
  const [cacheSize, setCacheSize] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // 🔧 暂时禁用 Service Worker 功能
  return (
    <Card className="p-6">
      <div className="text-center text-gray-500">
        <AlertCircle className="w-12 h-12 mx-auto mb-4" />
        <p>Service Worker 功能暂时禁用</p>
        <p className="text-sm mt-2">正在进行系统维护</p>
      </div>
    </Card>
  );
}

export default ServiceWorkerPanel;