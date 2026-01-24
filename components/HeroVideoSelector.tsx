/**
 * 🎬 Hero 影片選擇器（開發輔助工具）
 * 用於預覽和切換不同的背景影片選項
 * 僅在開發模式下顯示
 */

import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Play, X, CheckCircle } from 'lucide-react';

interface VideoOption {
  id: string;
  name: string;
  url: string;
  description: string;
  theme: string;
  duration: string;
}

const VIDEO_OPTIONS: VideoOption[] = [
  {
    id: 'tech-code',
    name: '程式碼與數據流動',
    url: 'https://cdn.pixabay.com/video/2022/11/29/141687-777037530_large.mp4',
    description: '動態程式碼、數據流、科技介面 - 展示平台的數位化',
    theme: '科技感',
    duration: '25秒'
  },
  {
    id: 'tech-network',
    name: '網路科技與連結',
    url: 'https://cdn.pixabay.com/video/2020/12/01/57834-486877482_large.mp4',
    description: '網路連結、全球化、數位網絡 - 強調全球接案平台',
    theme: '科技感',
    duration: '20秒'
  },
  {
    id: 'tech-cloud',
    name: '數位雲端資料',
    url: 'https://cdn.pixabay.com/video/2021/04/11/70892-538799109_large.mp4',
    description: '雲端運算、數據處理 - 展示雲端協作概念',
    theme: '科技感',
    duration: '18秒'
  },
  {
    id: 'office-team',
    name: '商業辦公室場景',
    url: 'https://cdn.pixabay.com/video/2021/08/04/84516-583693651_large.mp4',
    description: '現代辦公室、團隊協作 - 展示專業商務環境',
    theme: '商務感',
    duration: '22秒'
  },
  {
    id: 'office-meeting',
    name: '商業團隊合作',
    url: 'https://cdn.pixabay.com/video/2020/05/30/40747-424810828_large.mp4',
    description: '會議討論、團隊溝通 - 強調協作精神',
    theme: '商務感',
    duration: '24秒'
  },
  {
    id: 'workspace-creative',
    name: '創意工作空間',
    url: 'https://cdn.pixabay.com/video/2020/08/26/49138-453434468_large.mp4',
    description: '現代工作環境、自由氛圍 - 展示創意與自由',
    theme: '創意感',
    duration: '20秒'
  },
  {
    id: 'code-editor',
    name: '程式碼編輯器',
    url: 'https://cdn.pixabay.com/video/2022/05/14/116826-710024934_large.mp4',
    description: '逼真的程式碼撰寫動畫 - 適合開發類平台',
    theme: '科技感',
    duration: '15秒'
  },
  {
    id: 'code-matrix',
    name: 'Matrix 程式碼雨',
    url: 'https://cdn.pixabay.com/video/2019/09/24/27796-361891617_large.mp4',
    description: '經典駭客帝國風格 - 強烈科技感',
    theme: '科技感',
    duration: '30秒'
  }
];

interface HeroVideoSelectorProps {
  onSelectVideo?: (videoUrl: string) => void;
  currentVideo?: string;
}

export function HeroVideoSelector({ onSelectVideo, currentVideo }: HeroVideoSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);

  const handleSelect = (video: VideoOption) => {
    if (onSelectVideo) {
      onSelectVideo(video.url);
    }
    
    // 複製代碼到剪貼簿
    const code = `<source 
  src="${video.url}" 
  type="video/mp4" 
/>`;
    
    navigator.clipboard.writeText(code).then(() => {
      alert(`✅ 已複製影片代碼到剪貼簿！\n\n請貼到 /components/Hero.tsx 中的 <video> 標籤內`);
    });
    
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-purple-600 hover:bg-purple-700 text-white shadow-2xl"
        size="lg"
      >
        🎬 選擇 Hero 影片
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 overflow-y-auto">
      <div className="min-h-screen p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                🎬 Hero 背景影片選擇器
              </h2>
              <p className="text-gray-300">
                點擊影片即可複製代碼到剪貼簿，然後貼到 Hero.tsx 中
              </p>
            </div>
            <Button
              onClick={() => setIsOpen(false)}
              variant="outline"
              size="lg"
              className="bg-white/10 text-white border-white hover:bg-white/20"
            >
              <X className="w-5 h-5 mr-2" />
              關閉
            </Button>
          </div>

          {/* Video Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {VIDEO_OPTIONS.map((video) => (
              <Card
                key={video.id}
                className="overflow-hidden hover:shadow-2xl transition-all cursor-pointer group"
                onClick={() => handleSelect(video)}
              >
                {/* Video Preview */}
                <div className="relative aspect-video bg-gray-900">
                  <video
                    src={video.url}
                    className="w-full h-full object-cover"
                    muted
                    loop
                    onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play()}
                    onMouseLeave={(e) => (e.currentTarget as HTMLVideoElement).pause()}
                  />
                  
                  {/* Play Overlay */}
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all flex items-center justify-center">
                    <div className="bg-white/90 rounded-full p-4 group-hover:scale-110 transition-transform">
                      <Play className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>
                  
                  {/* Current Badge */}
                  {currentVideo === video.url && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-green-500 text-white">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        當前使用
                      </Badge>
                    </div>
                  )}
                  
                  {/* Duration */}
                  <div className="absolute bottom-2 right-2">
                    <Badge className="bg-black/70 text-white">
                      {video.duration}
                    </Badge>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg">{video.name}</h3>
                    <Badge variant="outline">{video.theme}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    {video.description}
                  </p>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(video);
                    }}
                  >
                    📋 複製代碼
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Instructions */}
          <Card className="mt-8 p-6 bg-blue-50 border-blue-200">
            <h3 className="font-bold text-lg mb-3">📝 使用說明</h3>
            <ol className="space-y-2 text-sm">
              <li>
                <strong>1.</strong> 將鼠標移到影片上預覽效果
              </li>
              <li>
                <strong>2.</strong> 點擊喜歡的影片，代碼會自動複製到剪貼簿
              </li>
              <li>
                <strong>3.</strong> 打開 <code className="bg-gray-200 px-2 py-1 rounded">/components/Hero.tsx</code>
              </li>
              <li>
                <strong>4.</strong> 找到 <code className="bg-gray-200 px-2 py-1 rounded">&lt;video&gt;</code> 標籤（約第 175 行）
              </li>
              <li>
                <strong>5.</strong> 替換第一個 <code className="bg-gray-200 px-2 py-1 rounded">&lt;source&gt;</code> 的 URL
              </li>
              <li>
                <strong>6.</strong> 保存檔案，影片會立即生效！
              </li>
            </ol>
          </Card>

          {/* Quick Code Example */}
          <Card className="mt-4 p-6 bg-gray-900 text-white">
            <h3 className="font-bold text-lg mb-3">💻 代碼範例</h3>
            <pre className="text-sm overflow-x-auto">
{`<video autoPlay muted loop playsInline>
  {/* 將複製的代碼貼在這裡 */}
  <source 
    src="YOUR_SELECTED_VIDEO_URL" 
    type="video/mp4" 
  />
</video>`}
            </pre>
          </Card>
        </div>
      </div>
    </div>
  );
}
