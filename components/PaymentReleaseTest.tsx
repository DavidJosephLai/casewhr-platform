import { useState } from 'react';
import { Button } from './ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { DollarSign } from 'lucide-react';

export function PaymentReleaseTest() {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');

  const translations = {
    zh: {
      confirmTitle: '確認撥款',
      confirmDesc: '確定要將款項撥給接案者嗎？此操作無法撤銷。',
      confirmButton: '確認撥款',
      cancel: '取消',
      amount: '金額',
    },
    en: {
      confirmTitle: 'Release Payment',
      confirmDesc: 'Are you sure you want to release the payment to the freelancer? This action cannot be undone.',
      confirmButton: 'Release Payment',
      cancel: 'Cancel',
      amount: 'Amount',
    },
  };

  const t = translations[language];

  return (
    <div className="p-8 max-w-md mx-auto space-y-4">
      <h2 className="text-2xl font-bold">撥款對話框測試</h2>
      
      <div className="flex gap-2">
        <Button
          variant={language === 'zh' ? 'default' : 'outline'}
          onClick={() => setLanguage('zh')}
        >
          中文
        </Button>
        <Button
          variant={language === 'en' ? 'default' : 'outline'}
          onClick={() => setLanguage('en')}
        >
          English
        </Button>
      </div>

      <Button
        onClick={() => setShowConfirmDialog(true)}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
        size="lg"
      >
        <DollarSign className="size-4 mr-2" />
        撥款給接案者
      </Button>

      <div className="text-sm text-gray-600 space-y-2">
        <p>✅ 點擊上面的按鈕後，應該會彈出確認對話框</p>
        <p>✅ 對話框標題：{t.confirmTitle}</p>
        <p>✅ 確認按鈕文字：{t.confirmButton}</p>
        <p>✅ 取消按鈕文字：{t.cancel}</p>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <DollarSign className="size-5 text-blue-600" />
              {t.confirmTitle}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p>{t.confirmDesc}</p>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm">
                  <strong>{t.amount}:</strong> NT$ 50,000
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                alert(`確認按鈕被點擊了！文字是：${t.confirmButton}`);
                setShowConfirmDialog(false);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {t.confirmButton}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
