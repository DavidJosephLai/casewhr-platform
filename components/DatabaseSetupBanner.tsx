import { AlertCircle, Database, ExternalLink, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Button } from "./ui/button";
import { useLanguage } from "../lib/LanguageContext";
import { useState } from "react";

interface DatabaseSetupBannerProps {
  show: boolean;
}

export function DatabaseSetupBanner({ show }: DatabaseSetupBannerProps) {
  const { language } = useLanguage();
  const [dismissed, setDismissed] = useState(false);

  if (!show || dismissed) {
    return null;
  }

  const content = language === 'en' ? {
    title: "Database Setup Required",
    description: "To enable the talent directory and user profiles, please set up your Supabase database.",
    steps: [
      "Go to Supabase SQL Editor",
      "Copy the SQL script from SUPABASE_SETUP.md",
      "Execute the script to create the profiles table",
      "Refresh this page"
    ],
    button: "Open Supabase Dashboard",
    dismiss: "Dismiss",
    learnMore: "View Setup Guide"
  } : {
    title: "需要設置資料庫",
    description: "要啟用人才目錄和用戶資料功能，請設置您的 Supabase 資料庫。",
    steps: [
      "前往 Supabase SQL 編輯器",
      "從 SUPABASE_SETUP.md 複製 SQL 腳本",
      "執行腳本以創建 profiles 表",
      "刷新此頁面"
    ],
    button: "開啟 Supabase 控制台",
    dismiss: "關閉",
    learnMore: "查看設置指南"
  };

  const openSupabase = () => {
    window.open('https://supabase.com/dashboard/project/bihplitfentxioxyjalb/sql/new', '_blank');
  };

  const openSetupGuide = () => {
    // Open the setup guide in a new window
    const setupContent = `
# Database Setup Instructions

Please follow these steps to set up your database:

1. Click "Open Supabase Dashboard" to open the SQL Editor
2. Copy the SQL script from the SUPABASE_SETUP.md file in your project
3. Paste and execute the script in the SQL Editor
4. Return to this page and refresh

The SQL script will create:
- profiles table for user data
- Row Level Security policies
- Automatic triggers for user registration
    `.trim();
    
    const blob = new Blob([setupContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in slide-in-from-bottom-5">
      <Alert className="border-blue-200 bg-blue-50 shadow-lg">
        <Database className="h-5 w-5 text-blue-600" />
        <AlertTitle className="text-blue-900 flex items-center gap-2">
          {content.title}
        </AlertTitle>
        <AlertDescription className="text-blue-800">
          <p className="mb-3">{content.description}</p>
          
          <div className="mb-4 space-y-2">
            {content.steps.map((step, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-blue-700">{index + 1}</span>
                </div>
                <span>{step}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              onClick={openSupabase}
            >
              <Database className="h-3 w-3" />
              {content.button}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDismissed(true)}
            >
              {content.dismiss}
            </Button>
          </div>

          <div className="mt-3 pt-3 border-t border-blue-200">
            <p className="text-xs text-blue-700">
              {language === 'en' 
                ? '📄 See SUPABASE_SETUP.md in your project for detailed instructions'
                : '📄 詳細說明請參閱專案中的 SUPABASE_SETUP.md 文件'
              }
            </p>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
