import { Film } from 'lucide-react';
import { Button } from './ui/button';

export function VideoAIFloatingButton() {
  const handleClick = () => {
    window.location.href = '/?view=video-ai-processor';
  };

  return (
    <div className="fixed bottom-24 right-6 z-40">
      <Button
        onClick={handleClick}
        className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all hover:scale-110"
        title="AI 影片處理"
      >
        <Film className="h-6 w-6 text-white" />
      </Button>
    </div>
  );
}
