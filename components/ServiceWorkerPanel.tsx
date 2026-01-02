/**
 * 🔧 Service Worker 管理面板
 * 用于管理和监控 Service Worker 状态
 */

import { useState, useEffect } from 'react';
import { RefreshCw, Trash2, Download, Info, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import {
  registerServiceWorker,
  unregisterServiceWorker,
  clearAllCaches,
  getCacheSize,
  formatCacheSize,
  skipWaitingAndActivate,
  checkForUpdates,
  getServiceWorkerStatus,
} from '../utils/serviceWorker';
import { toast } from 'sonner';

export function ServiceWorkerPanel() {
  const [status, setStatus] = useState<any>(null);
  const [cacheSize, setCacheSize] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);

  // 加载状态
  const loadStatus = async () => {
    const swStatus = await getServiceWorkerStatus();
    setStatus(swStatus);
    setHasUpdate(!!swStatus.waiting);

    if (swStatus.supported) {
      const size = await getCacheSize();
      setCacheSize(size);
    }
  };

  useEffect(() => {
    loadStatus();

    // 定期检查状态
    const interval = setInterval(loadStatus, 10000); // 每10秒检查一次

    return () => clearInterval(interval);
  }, []);

  // 注册 Service Worker
  const handleRegister = async () => {
    setIsLoading(true);
    try {
      const registration = await registerServiceWorker({
        onUpdate: () => {
          setHasUpdate(true);
          toast.info('🔄 有新版本可用！', {
            description: '点击"更新并重载"以应用更新',
            duration: 10000,
          });
        },
        onSuccess: () => {
          toast.success('✅ Service Worker 已激活');
        },
      });

      if (registration) {
        await loadStatus();
        toast.success('✅ Service Worker 注册成功');
      } else {
        toast.error('❌ Service Worker 注册失败');
      }
    } catch (error) {
      console.error(error);
      toast.error('❌ Service Worker 注册失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 卸载 Service Worker
  const handleUnregister = async () => {
    setIsLoading(true);
    try {
      const success = await unregisterServiceWorker();
      if (success) {
        await loadStatus();
        toast.success('✅ Service Worker 已卸载');
      } else {
        toast.error('❌ Service Worker 卸载失败');
      }
    } catch (error) {
      console.error(error);
      toast.error('❌ Service Worker 卸载失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 清除缓存
  const handleClearCache = async () => {
    setIsLoading(true);
    try {
      const success = await clearAllCaches();
      if (success) {
        await loadStatus();
        toast.success('✅ 缓存已清除');
      } else {
        toast.error('❌ 清除缓存失败');
      }
    } catch (error) {
      console.error(error);
      toast.error('❌ 清除缓存失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 更新并重载
  const handleUpdateAndReload = async () => {
    setIsLoading(true);
    try {
      const success = await skipWaitingAndActivate();
      if (success) {
        toast.success('✅ 正在重新加载...', {
          description: '应用新版本',
        });
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error('❌ 更新失败');
      }
    } catch (error) {
      console.error(error);
      toast.error('❌ 更新失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 检查更新
  const handleCheckUpdate = async () => {
    setIsLoading(true);
    try {
      const hasUpdate = await checkForUpdates();
      if (hasUpdate) {
        setHasUpdate(true);
        toast.info('🔄 发现新版本！', {
          description: '点击"更新并重载"以应用',
        });
      } else {
        toast.success('✅ 已是最新版本');
      }
    } catch (error) {
      console.error(error);
      toast.error('❌ 检查更新失败');
    } finally {
      setIsLoading(false);
    }
  };

  if (!status) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span className="ml-2">加载中...</span>
        </div>
      </Card>
    );
  }

  if (!status.supported) {
    return (
      <Card className="p-6">
        <div className="flex items-center text-yellow-600">
          <AlertCircle className="w-6 h-6 mr-2" />
          <div>
            <h3 className="font-semibold">不支持 Service Worker</h3>
            <p className="text-sm text-gray-600 mt-1">
              您的浏览器不支持 Service Worker 功能
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 更新提示 */}
      {hasUpdate && (
        <Card className="p-4 border-blue-200 bg-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Info className="w-5 h-5 text-blue-600 mr-2" />
              <div>
                <h4 className="font-semibold text-blue-900">有新版本可用</h4>
                <p className="text-sm text-blue-700 mt-1">
                  发现新版本的应用，点击更新以获得最新功能
                </p>
              </div>
            </div>
            <Button
              onClick={handleUpdateAndReload}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              更新并重载
            </Button>
          </div>
        </Card>
      )}

      {/* 状态卡片 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Info className="w-5 h-5 mr-2" />
          Service Worker 状态
        </h3>

        <div className="space-y-3">
          {/* 注册状态 */}
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-gray-600">注册状态</span>
            <div className="flex items-center">
              {status.registered ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  <span className="text-green-600 font-medium">已注册</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">未注册</span>
                </>
              )}
            </div>
          </div>

          {/* 控制器状态 */}
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-gray-600">控制器</span>
            <div className="flex items-center">
              {status.controller ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  <span className="text-green-600 font-medium">活跃</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">未活跃</span>
                </>
              )}
            </div>
          </div>

          {/* 缓存大小 */}
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-600">缓存大小</span>
            <span className="font-medium">{formatCacheSize(cacheSize)}</span>
          </div>
        </div>
      </Card>

      {/* 操作按钮 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">操作</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {!status.registered ? (
            <Button
              onClick={handleRegister}
              disabled={isLoading}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              注册 Service Worker
            </Button>
          ) : (
            <Button
              onClick={handleUnregister}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              卸载 Service Worker
            </Button>
          )}

          <Button
            onClick={handleCheckUpdate}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            检查更新
          </Button>

          <Button
            onClick={handleClearCache}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            清除缓存
          </Button>

          <Button
            onClick={loadStatus}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新状态
          </Button>
        </div>
      </Card>

      {/* 说明 */}
      <Card className="p-6 bg-gray-50">
        <h3 className="text-lg font-semibold mb-3">关于 Service Worker</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            <strong>🚀 离线支持：</strong>
            Service Worker 可以缓存应用资源，让您在离线时也能访问部分功能。
          </p>
          <p>
            <strong>⚡ 性能提升：</strong>
            缓存静态资源和图片，减少网络请求，提升加载速度。
          </p>
          <p>
            <strong>🔄 自动更新：</strong>
            应用会自动检查更新，发现新版本时会提示您更新。
          </p>
        </div>
      </Card>
    </div>
  );
}

export default ServiceWorkerPanel;