import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Button } from "./ui/button";
import { X, KeyRound } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { oauthConfig } from "../config/oauth";

export function OAuthNotice() {
  const { language } = useLanguage();
  const [visible, setVisible] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const wasDismissed = localStorage.getItem('oauth-notice-dismissed');
    if (wasDismissed === 'true') {
      setVisible(false);
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('oauth-notice-dismissed', 'true');
    setVisible(false);
    setDismissed(true);
  };

  // Don't show notice if OAuth notice is disabled in config
  if (!oauthConfig.showOAuthNotice || !visible || dismissed) return null;

  return (
    <Alert className="border-blue-200 bg-blue-50 mb-6">
      <KeyRound className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-900 flex items-center justify-between">
        <span>
          {language === 'en' ? 'Social Login Setup' : '社交登入設置'}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="h-6 w-6 p-0 hover:bg-blue-100"
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertTitle>
      <AlertDescription className="text-blue-800 text-sm">
        {language === 'en' ? (
          <>
            Google, GitHub and Facebook login buttons are visible but require setup. Open the{' '}
            <strong>Admin Panel</strong> (bottom right) → <strong>OAuth Setup</strong> tab for instructions.
          </>
        ) : (
          <>
            Google、GitHub 和 Facebook 登入按鈕已顯示，但需要設置。請打開右下角的{' '}
            <strong>管理面板</strong> → <strong>OAuth 設置</strong> 標籤查看說明。
          </>
        )}
      </AlertDescription>
    </Alert>
  );
}