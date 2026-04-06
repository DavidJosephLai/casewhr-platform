import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Film, Download, Upload, Sparkles, RefreshCw } from 'lucide-react';

interface ProcessedVideo {
  id: string;
  original_url: string;
  processed_url: string;
  effect: string;
  created_at: string;
  is_active: boolean;
}

export function HeroVideoManager() {
  const { accessToken } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [videos, setVideos] = useState<ProcessedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  
  const currentVideoUrl = 'https://bihplitfentxioxyjalb.supabase.co/storage/v1/object/public/Background/7693400-hd_1920_1080_25fps.mp4';

  // 載入已處理的影片列表
  useEffect(() => {
    loadProcessedVideos();
  }, []);

  const loadProcessedVideos = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/video-ai/hero-videos`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setVideos(data.videos || []);
      }
    } catch (error) {
      console.error('❌ [HeroVideoManager] Error loading videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessVideo = async (effect: string) => {
    if (!accessToken) {
      toast.error('請先登入');
      return;
    }

    setProcessing(true);
    
    try {
      console.log('🎬 [HeroVideoManager] Processing video with effect:', effect);
      
      toast.info('🎬 正在處理影片...這可能需要幾分鐘', { duration: 5000 });

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/video-ai/process-hero-video`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            videoUrl: currentVideoUrl,
            effect: effect,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '處理失敗');
      }

      console.log('✅ [HeroVideoManager] Video processed:', data);
      
      toast.success(`✅ 影片處理完成！效果：${effect}`);
      
      // 重新載入影片列表
      await loadProcessedVideos();
      
    } catch (error: any) {
      console.error('❌ [HeroVideoManager] Error:', error);
      toast.error(`❌ 處理失敗：${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleSetActive = async (videoId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/video-ai/set-active-hero-video`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ videoId }),
        }
      );

      if (!response.ok) {
        throw new Error('設置失敗');
      }

      toast.success('✅ 已設為啟用影片！請刷新頁面查看');
      
      // 重新載入影片列表
      await loadProcessedVideos();
      
    } catch (error: any) {
      console.error('❌ [HeroVideoManager] Error:', error);
      toast.error(`❌ 設置失敗：${error.message}`);
    }
  };

  const effects = [
    { id: 'enhance', name: '🎨 色彩增強', description: '增強飽和度和對比度' },
    { id: 'motion', name: '🚀 動感強調', description: '增強運動效果' },
    { id: 'cinematic', name: '🎬 電影級調色', description: '專業電影色調' },
    { id: 'vibrant', name: '✨ 活力四射', description: '鮮豔明亮' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <Film className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Hero 背景影片管理</h2>
        </div>

        {/* 當前影片 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">📹 當前背景影片</h3>
          <div className="bg-gray-50 rounded p-4">
            <video
              src={currentVideoUrl}
              className="w-full max-w-md rounded shadow-sm mb-2"
              controls
              muted
            />
            <p className="text-sm text-gray-600 break-all">{currentVideoUrl}</p>
          </div>
        </div>

        {/* AI 處理選項 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">🎨 AI 處理效果</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {effects.map((effect) => (
              <Button
                key={effect.id}
                onClick={() => handleProcessVideo(effect.id)}
                disabled={processing}
                variant="outline"
                className="justify-start h-auto p-4"
              >
                <div className="text-left">
                  <div className="font-semibold">{effect.name}</div>
                  <div className="text-sm text-gray-600">{effect.description}</div>
                </div>
              </Button>
            ))}
          </div>
          {processing && (
            <div className="mt-4 flex items-center gap-2 text-blue-600">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>處理中...請稍候（可能需要 2-5 分鐘）</span>
            </div>
          )}
        </div>

        {/* 已處理的影片 */}
        <div>
          <h3 className="text-lg font-semibold mb-3">📚 已處理的影片</h3>
          {videos.length === 0 ? (
            <p className="text-gray-500 text-center py-4">尚無處理過的影片</p>
          ) : (
            <div className="space-y-3">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className={`border rounded-lg p-4 ${
                    video.is_active ? 'border-green-500 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">
                          {effects.find(e => e.id === video.effect)?.name || video.effect}
                        </span>
                        {video.is_active && (
                          <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">
                            啟用中
                          </span>
                        )}
                      </div>
                      <video
                        src={video.processed_url}
                        className="w-full max-w-sm rounded shadow-sm mb-2"
                        controls
                        muted
                      />
                      <p className="text-xs text-gray-500">
                        處理時間：{new Date(video.created_at).toLocaleString('zh-TW')}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {!video.is_active && (
                        <Button
                          onClick={() => handleSetActive(video.id)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Sparkles className="h-4 w-4 mr-1" />
                          設為啟用
                        </Button>
                      )}
                      <Button
                        onClick={() => window.open(video.processed_url, '_blank')}
                        size="sm"
                        variant="outline"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        下載
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
