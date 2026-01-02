import { AlertTriangle, ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Button } from "./ui/button";
import { useLanguage } from "../lib/LanguageContext";

export function FigmaEnvironmentWarning() {
  const { language } = useLanguage();
  
  // 检测是否在 Figma 预览环境中
  const isFigmaPreview = window.location.hostname.includes('figma');

  // 如果不在 Figma 环境中，不显示警告
  if (!isFigmaPreview) {
    return null;
  }

  const openInNewTab = () => {
    // 获取当前页面的 URL（不包含域名）
    const currentPath = window.location.pathname + window.location.search;
    
    // 在新标签页打开实际网站
    window.open(`https://casewhr.com${currentPath}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <Alert className="border-2 border-red-500 bg-red-50 mb-6 shadow-lg">
      <AlertTriangle className="h-6 w-6 text-red-600" />
      <AlertTitle className="text-red-900 text-lg">
        {language === 'en' 
          ? '⚠️ You are in Figma Preview Mode' 
          : '⚠️ 您正在 Figma 預覽模式中'}
      </AlertTitle>
      <AlertDescription className="text-red-800 space-y-3">
        <p className="font-medium">
          {language === 'en'
            ? 'PayPal payments will not work in this environment due to browser security restrictions.'
            : 'PayPal 支付在此環境中無法正常工作，原因是瀏覽器安全限制。'}
        </p>
        
        <div className="bg-white/70 p-3 rounded border border-red-300">
          <p className="text-sm mb-2">
            {language === 'en'
              ? '🔒 Why this happens:'
              : '🔒 為什麼會這樣：'}
          </p>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li>
              {language === 'en'
                ? 'Figma runs your app inside an iframe'
                : 'Figma 在 iframe 中運行您的應用'}
            </li>
            <li>
              {language === 'en'
                ? 'PayPal redirects cannot work across iframes'
                : 'PayPal 重定向無法跨 iframe 工作'}
            </li>
            <li>
              {language === 'en'
                ? 'This is a browser security feature, not a code bug'
                : '這是瀏覽器安全特性，不是代碼錯誤'}
            </li>
          </ul>
        </div>

        <div className="flex gap-2 pt-2">
          <Button 
            onClick={openInNewTab}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            {language === 'en'
              ? 'Open in Real Website (casewhr.com)'
              : '在實際網站中打開 (casewhr.com)'}
          </Button>
        </div>

        <p className="text-xs pt-2 border-t border-red-300 mt-3">
          {language === 'en'
            ? '💡 Tip: All payment features work perfectly on the actual website. This warning only appears in Figma preview.'
            : '💡 提示：所有支付功能在實際網站上完美運行。此警告僅在 Figma 預覽中顯示。'}
        </p>
      </AlertDescription>
    </Alert>
  );
}
