import React from 'react';
import { EmailDeliveryHelp } from './EmailDeliveryHelp';

/**
 * 郵件送達幫助組件 - 使用示例
 * 
 * 在以下場景中使用此組件：
 * 1. 用戶註冊後的確認頁面
 * 2. 提交提案後的成功頁面
 * 3. 設置頁面的郵件通知區域
 * 4. 任何發送郵件後的提示頁面
 */

export function EmailDeliveryDemo() {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-gray-900 mb-2">
          郵件送達幫助組件
        </h1>
        <p className="text-gray-600">
          當用戶可能收不到郵件時（特別是 Hotmail/Outlook 用戶），顯示此組件
        </p>
      </div>

      {/* 中文版示例 - Hotmail 用戶 */}
      <div className="space-y-2">
        <h2 className="text-gray-800">
          示例 1：中文版（Hotmail 用戶）
        </h2>
        <EmailDeliveryHelp 
          userEmail="user@hotmail.com"
          language="zh"
        />
      </div>

      {/* 英文版示例 - Outlook 用戶 */}
      <div className="space-y-2">
        <h2 className="text-gray-800">
          示例 2：英文版（Outlook 用戶）
        </h2>
        <EmailDeliveryHelp 
          userEmail="user@outlook.com"
          language="en"
        />
      </div>

      {/* 其他郵箱用戶 */}
      <div className="space-y-2">
        <h2 className="text-gray-800">
          示例 3：其他郵箱（Gmail）
        </h2>
        <EmailDeliveryHelp 
          userEmail="user@gmail.com"
          language="zh"
        />
      </div>

      {/* 使用說明 */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4">
        <h2 className="text-gray-900">
          📝 使用方法
        </h2>
        
        <div className="space-y-3 text-sm">
          <div>
            <h3 className="text-gray-800 mb-1">
              1. 在提案提交成功頁面使用
            </h3>
            <pre className="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
{`import { EmailDeliveryHelp } from './components/EmailDeliveryHelp';

// 在提案提交成功後顯示
<EmailDeliveryHelp 
  userEmail={userProfile.email}
  language={userProfile.language || 'zh'}
/>`}
            </pre>
          </div>

          <div>
            <h3 className="text-gray-800 mb-1">
              2. 在用戶設置頁面使用
            </h3>
            <pre className="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
{`// 在郵件通知設置區域
{userEmail?.includes('@hotmail.') || userEmail?.includes('@outlook.') ? (
  <EmailDeliveryHelp 
    userEmail={userEmail}
    language={language}
  />
) : null}`}
            </pre>
          </div>

          <div>
            <h3 className="text-gray-800 mb-1">
              3. 條件顯示（僅針對 Hotmail/Outlook）
            </h3>
            <pre className="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
{`const isHotmailUser = 
  email?.includes('@hotmail.') || 
  email?.includes('@outlook.') || 
  email?.includes('@live.');

{isHotmailUser && (
  <EmailDeliveryHelp 
    userEmail={email}
    language={language}
  />
)}`}
            </pre>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <p className="text-sm text-blue-800">
            💡 <strong>提示：</strong>此組件會自動檢測用戶是否使用 Hotmail/Outlook，
            並為這些用戶顯示直接打開垃圾郵件文件夾的快捷連結。
          </p>
        </div>
      </div>
    </div>
  );
}
