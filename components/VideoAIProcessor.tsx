import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, Upload, Film, Zap, Download, Play, Trash2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useAuth } from '../contexts/AuthContext';

interface VideoFile {
  file: File;
  preview: string;
  uploaded: boolean;
  storagePath?: string;
}

interface ProcessedVideo {
  url: string;
  features: {
    duration: number;
    fps: number;
    resolution: string;
    motionIntensity: number;
    sceneChanges: number;
  };
}

export function VideoAIProcessor() {
  const { accessToken } = useAuth();
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processedVideos, setProcessedVideos] = useState<ProcessedVideo[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;
    
    // 限制最多 2 個影片
    if (videos.length + files.length > 2) {
      toast.error('最多只能上傳 2 段影片');
      return;
    }

    const newVideos: VideoFile[] = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      uploaded: false,
    }));

    setVideos(prev => [...prev, ...newVideos]);
    toast.success(`已選擇 ${files.length} 個影片`);
  };

  const removeVideo = (index: number) => {
    setVideos(prev => {
      const newVideos = [...prev];
      URL.revokeObjectURL(newVideos[index].preview);
      newVideos.splice(index, 1);
      return newVideos;
    });
    toast.success('已移除影片');
  };

  const uploadVideos = async () => {
    if (videos.length === 0) {
      toast.error('請先選擇影片');
      return;
    }

    if (!accessToken) {
      toast.error('請先登入');
      return;
    }

    setUploading(true);

    try {
      for (let i = 0; i < videos.length; i++) {
        const video = videos[i];
        
        if (video.uploaded) continue;

        console.log(`📤 [VideoAI] Uploading video ${i + 1}...`);

        const formData = new FormData();
        formData.append('video', video.file);

        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/video-ai/upload`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
            body: formData,
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        const data = await response.json();
        console.log(`✅ [VideoAI] Video ${i + 1} uploaded:`, data);

        setVideos(prev => {
          const newVideos = [...prev];
          newVideos[i].uploaded = true;
          newVideos[i].storagePath = data.path;
          return newVideos;
        });

        toast.success(`影片 ${i + 1} 上傳成功！`);
      }

      toast.success('✅ 所有影片上傳完成！');
    } catch (error: any) {
      console.error('❌ [VideoAI] Upload error:', error);
      toast.error(`上傳失敗：${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const processVideos = async () => {
    if (videos.length === 0) {
      toast.error('請先上傳影片');
      return;
    }

    if (!videos.every(v => v.uploaded)) {
      toast.error('請先上傳所有影片');
      return;
    }

    setProcessing(true);
    setProcessedVideos([]);

    try {
      console.log('🎬 [VideoAI] Processing videos...');

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/video-ai/process`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            videoPaths: videos.map(v => v.storagePath),
            effects: {
              motionEnhancement: true,
              colorBoost: true,
              speedVariation: true,
              transitionEffects: true,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Processing failed');
      }

      const data = await response.json();
      console.log('✅ [VideoAI] Processing complete:', data);

      setProcessedVideos(data.processedVideos || []);
      toast.success('🎉 影片處理完成！');
    } catch (error: any) {
      console.error('❌ [VideoAI] Processing error:', error);
      toast.error(`處理失敗：${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Film className="w-6 h-6" />
            AI 影片特徵提取與動感強調
          </CardTitle>
          <CardDescription>
            上傳影片，AI 自���分析並強化動感效果
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 上傳區 */}
          <div>
            <h3 className="font-semibold mb-3">📤 上傳影片（最多 2 段）</h3>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-500 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                disabled={videos.length >= 2}
              >
                <Upload className="w-4 h-4 mr-2" />
                選擇影片
              </Button>
              
              <p className="text-sm text-gray-500 mt-2">
                支援 MP4, MOV, AVI 等格式
              </p>
            </div>
          </div>

          {/* 已選影片列表 */}
          {videos.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">📹 已選影片</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {videos.map((video, index) => (
                  <Card key={index} className="overflow-hidden">
                    <div className="relative">
                      <video
                        src={video.preview}
                        className="w-full h-48 object-cover"
                        controls
                      />
                      {video.uploaded && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          已上傳
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm truncate">
                            {video.file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(video.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeVideo(index)}
                          disabled={uploading || processing}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* 操作按鈕 */}
          <div className="flex gap-3">
            <Button
              onClick={uploadVideos}
              disabled={uploading || videos.length === 0 || videos.every(v => v.uploaded)}
              className="flex-1"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  上傳中...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  上傳影片
                </>
              )}
            </Button>

            <Button
              onClick={processVideos}
              disabled={processing || !videos.every(v => v.uploaded)}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  處理中...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  AI 處理
                </>
              )}
            </Button>
          </div>

          {/* 處理進度提示 */}
          {processing && (
            <Alert className="border-purple-600 bg-purple-50">
              <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
              <AlertDescription className="text-purple-900">
                <strong>AI 處理中...</strong>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>分析影片特徵（動作強度、場景切換）</li>
                  <li>提取關鍵幀與運動軌跡</li>
                  <li>應用動感強調效果</li>
                  <li>生成最終影片</li>
                </ul>
                <p className="text-xs mt-2">預計需要 1-3 分鐘，請耐心等待...</p>
              </AlertDescription>
            </Alert>
          )}

          {/* 處理結果 */}
          {processedVideos.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">🎉 處理完成</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {processedVideos.map((video, index) => (
                  <Card key={index} className="overflow-hidden">
                    <div className="relative">
                      <video
                        src={video.url}
                        className="w-full h-48 object-cover"
                        controls
                      />
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">時長：</span>
                          <span className="font-medium">{video.features.duration}s</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">幀率：</span>
                          <span className="font-medium">{video.features.fps} FPS</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">解析度：</span>
                          <span className="font-medium">{video.features.resolution}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">動感強度：</span>
                          <span className="font-medium text-purple-600">
                            {video.features.motionIntensity}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">場景切換：</span>
                          <span className="font-medium">{video.features.sceneChanges} 次</span>
                        </div>
                      </div>

                      <Button
                        className="w-full"
                        onClick={() => {
                          const a = document.createElement('a');
                          a.href = video.url;
                          a.download = `processed_video_${index + 1}.mp4`;
                          a.click();
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        下載影片
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* 功能說明 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">✨ AI 處理效果：</h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>🎯 <strong>動作檢測：</strong>自動識別影片中的運動區域</li>
              <li>🌈 <strong>顏色增強：</strong>提升色彩飽和度和對比度</li>
              <li>⚡ <strong>速度變化：</strong>根據節奏智能調整播放速度</li>
              <li>✨ <strong>場景過渡：</strong>添加動態過渡效果</li>
              <li>🎬 <strong>關鍵幀提取：</strong>突出重要畫面</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}