import { useLanguage } from '../lib/LanguageContext';
import { ExternalLink, Users, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

export function PayPalSandboxGuide() {
  const { language } = useLanguage();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Users className="h-6 w-6" />
            {language === 'en' ? '🧪 PayPal Sandbox Testing Guide' : '🧪 PayPal 測試環境使用指南'}
          </CardTitle>
          <CardDescription className="text-blue-700">
            {language === 'en' 
              ? 'Learn how to create and use PayPal Sandbox test accounts for testing payments' 
              : '學習如何創建和使用 PayPal Sandbox 測試帳號來測試支付功能'}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Step 1: Create Sandbox Account */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold">1</span>
            {language === 'en' ? 'Create PayPal Sandbox Test Account' : '創建 PayPal Sandbox 測試帳號'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="font-semibold text-yellow-900">
                  {language === 'en' ? '⚠️ Important' : '⚠️ 重要提醒'}
                </p>
                <p className="text-sm text-yellow-800">
                  {language === 'en' 
                    ? 'You CANNOT use your real PayPal account in Sandbox mode. You must create a test account first.' 
                    : '您不能在測試環境中使用真實的 PayPal 帳號。您必須先創建一個測試帳號。'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">
              {language === 'en' ? 'Follow these steps:' : '請按照以下步驟操作：'}
            </h4>
            
            <ol className="space-y-3 list-decimal list-inside text-sm text-gray-700">
              <li>
                <span className="font-medium">{language === 'en' ? 'Open PayPal Developer Dashboard' : '打開 PayPal 開發者儀表板'}</span>
                <div className="mt-2 ml-6">
                  <a
                    href="https://developer.paypal.com/dashboard/accounts"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {language === 'en' ? 'Open PayPal Developer Dashboard' : '打開 PayPal 開發者儀表板'}
                  </a>
                </div>
              </li>

              <li>
                <span className="font-medium">{language === 'en' ? 'Login with your real PayPal account' : '使用您的真實 PayPal 帳號登入'}</span>
                <p className="ml-6 text-gray-600 mt-1">
                  {language === 'en' 
                    ? '(This is just for managing the developer dashboard, not for payments)' 
                    : '（這只是用來管理開發者儀表板，不是用來支付的）'}
                </p>
              </li>

              <li>
                <span className="font-medium">{language === 'en' ? 'Click "Sandbox" → "Accounts"' : '點擊「Sandbox」→「Accounts」'}</span>
              </li>

              <li>
                <span className="font-medium">{language === 'en' ? 'Click "Create account" button' : '點擊「Create account」按鈕'}</span>
              </li>

              <li>
                <span className="font-medium">{language === 'en' ? 'Configure the test account' : '配置測試帳號'}</span>
                <div className="ml-6 mt-2 space-y-2 text-gray-600">
                  <p>• <strong>{language === 'en' ? 'Account type' : '帳號類型'}:</strong> {language === 'en' ? 'Personal' : '個人帳號 (Personal)'}</p>
                  <p>• <strong>{language === 'en' ? 'Country' : '國家'}:</strong> {language === 'en' ? 'Taiwan or United States' : '台灣或美國'}</p>
                  <p>• <strong>{language === 'en' ? 'Balance' : '初始餘額'}:</strong> {language === 'en' ? '$5,000 (default is fine)' : '$5,000（預設即可）'}</p>
                </div>
              </li>

              <li>
                <span className="font-medium">{language === 'en' ? 'Click "Create" button' : '點擊「Create」按鈕'}</span>
              </li>

              <li>
                <span className="font-medium">{language === 'en' ? 'Get the test account credentials' : '獲取測試帳號憑證'}</span>
                <div className="ml-6 mt-2 space-y-2">
                  <p className="text-gray-600">
                    {language === 'en' 
                      ? 'In the accounts list, find your newly created account and click "..." → "View/Edit account"' 
                      : '在帳號列表中，找到剛創建的帳號，點擊「...」→「View/Edit account」'}
                  </p>
                  <div className="bg-gray-50 border border-gray-200 rounded p-3 font-mono text-xs">
                    <p className="text-green-700">Email: sb-xxxxx@personal.example.com</p>
                    <p className="text-green-700">Password: [PayPal generated password]</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    ⚠️ {language === 'en' ? 'Save these credentials! You will need them to login.' : '請保存這些憑證！您稍後需要使用它們登入。'}
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Test Payment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white text-sm font-bold">2</span>
            {language === 'en' ? 'Test Payment with Sandbox Account' : '使用測試帳號進行支付測試'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="space-y-3 list-decimal list-inside text-sm text-gray-700">
            <li>
              <span className="font-medium">{language === 'en' ? 'Go to Wallet page and click "Deposit"' : '前往錢包頁面，點擊「充值」按鈕'}</span>
            </li>

            <li>
              <span className="font-medium">{language === 'en' ? 'Enter amount (e.g., $10)' : '輸入金額（例如：$10）'}</span>
            </li>

            <li>
              <span className="font-medium">{language === 'en' ? 'Click "PayPal Payment" button' : '點擊「PayPal 付款」按鈕'}</span>
            </li>

            <li>
              <span className="font-medium">{language === 'en' ? 'On PayPal login page, use your Sandbox test account' : '在 PayPal 登入頁面，使用您的 Sandbox 測試帳號'}</span>
              <div className="ml-6 mt-2 bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm text-blue-900 font-medium mb-2">
                  {language === 'en' ? '⚠️ Use test account, NOT your real PayPal account!' : '⚠️ 使用測試帳號，不是您的真實 PayPal 帳號！'}
                </p>
                <div className="font-mono text-xs text-blue-800">
                  <p>Email: sb-xxxxx@personal.example.com</p>
                  <p>Password: [您的測試帳號密碼]</p>
                </div>
              </div>
            </li>

            <li>
              <span className="font-medium">{language === 'en' ? 'Click "Log In" button' : '點擊「Log In」按鈕'}</span>
            </li>

            <li>
              <span className="font-medium">{language === 'en' ? 'Confirm the payment' : '確認支付'}</span>
              <p className="ml-6 text-gray-600 mt-1">
                {language === 'en' 
                  ? 'You will see a page showing the payment amount and merchant name (Case Where)' 
                  : '您會看到顯示支付金額和商家名稱（Case Where）的頁面'}
              </p>
            </li>

            <li>
              <span className="font-medium">{language === 'en' ? 'Click "Complete Purchase" or "Pay Now"' : '點擊「Complete Purchase」或「Pay Now」'}</span>
            </li>

            <li>
              <span className="font-medium">{language === 'en' ? 'Wait for redirect back to the platform' : '等待自動跳轉回平台'}</span>
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Step 3: Verify Success */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 text-white text-sm font-bold">3</span>
            {language === 'en' ? 'Verify Payment Success' : '驗證支付成功'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-700">
            {language === 'en' 
              ? 'After payment is complete, you should see:' 
              : '支付完成後，您應該看到：'}
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">
                  {language === 'en' ? 'Success message: "Payment successful! $XX added to your wallet."' : '成功訊息：「付款成功！已將 $XX 加入您的錢包。」'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">
                  {language === 'en' ? 'Wallet balance updated immediately' : '錢包餘額立即更新'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">
                  {language === 'en' ? 'New transaction record in transaction history' : '交易記錄中新增一筆充值記錄'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {language === 'en' ? 'Common Questions' : '常見問題'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                ❓ {language === 'en' ? 'Why can\'t I use my real PayPal account?' : '為什麼不能使用我的真實 PayPal 帳號？'}
              </h4>
              <p className="text-sm text-gray-700">
                {language === 'en' 
                  ? 'Sandbox mode is for testing only. It uses PayPal\'s test environment which requires test accounts. Real accounts only work in Live mode.' 
                  : 'Sandbox 模式僅用於測試。它使用 PayPal 的測試環境，該環境要求使用測試帳號。真實帳號只能在 Live 模式下使用。'}
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                ❓ {language === 'en' ? 'Will I be charged real money?' : '會扣除真實金錢嗎？'}
              </h4>
              <p className="text-sm text-gray-700">
                {language === 'en' 
                  ? 'No! Sandbox mode uses virtual money. No real charges will be made.' 
                  : '不會！Sandbox 模式使用虛擬金錢。不會產生任何真實費用。'}
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                ❓ {language === 'en' ? 'How do I switch to Live mode for real payments?' : '如何切換到 Live 模式進行真實支付？'}
              </h4>
              <p className="text-sm text-gray-700">
                {language === 'en' 
                  ? 'Update PAYPAL_MODE environment variable to "live" and use your Live API credentials. Then you can use real PayPal accounts.' 
                  : '將環境變數 PAYPAL_MODE 更新為 "live" 並使用您的正式環境 API 憑證。然後就可以使用真實的 PayPal 帳號了。'}
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                ❓ {language === 'en' ? 'Where can I find my test account password?' : '在哪裡可以找到測試帳號的密碼？'}
              </h4>
              <p className="text-sm text-gray-700">
                {language === 'en' 
                  ? 'In the PayPal Developer Dashboard, go to Sandbox → Accounts, find your test account, click "..." → "View/Edit account" to see the password.' 
                  : '在 PayPal 開發者儀表板中，前往 Sandbox → Accounts，找到您的測試帳號，點擊「...」→「View/Edit account」即可查看密碼。'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Action */}
      <div className="flex justify-center">
        <a
          href="https://developer.paypal.com/dashboard/accounts"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold"
        >
          <ExternalLink className="h-5 w-5" />
          {language === 'en' ? 'Create Sandbox Account Now' : '立即創建 Sandbox 測試帳號'}
        </a>
      </div>
    </div>
  );
}
