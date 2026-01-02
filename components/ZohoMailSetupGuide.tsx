import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Mail, 
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Info,
  Users,
  Settings,
  Key,
  Globe,
  Search,
  ChevronRight,
  HelpCircle
} from 'lucide-react';

export function ZohoMailSetupGuide() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="space-y-6">
      {/* 標題 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle>Zoho Mail 設定完整指南</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Zoho Mail 是系統用來接收和管理郵件的服務
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 核心說明 */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <strong>💡 重要說明：Zoho Mail 在系統中的角色</strong>
          <div className="mt-2 space-y-2 text-sm">
            <p>• <strong>Brevo</strong>：負責「發送」郵件（SMTP 服務）</p>
            <p>• <strong>Zoho Mail</strong>：負責「接收」郵件（郵箱服務）</p>
            <p>• 您需要 Zoho Mail 來接收用戶回覆、系統通知等</p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Zoho Mail 不在系統中設定 */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-900">
            <HelpCircle className="h-5 w-5" />
            Zoho Mail 在哪裡設定？
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert className="border-orange-300 bg-orange-100">
              <AlertTriangle className="h-4 w-4 text-orange-700" />
              <AlertDescription className="text-orange-900">
                <strong>⚠️ 重要：Zoho Mail 不在 Case Where 系統中設定！</strong>
                <p className="mt-2">
                  Zoho Mail 是一個獨立的郵件服務，需要在 Zoho 官方網站進行配置。
                  Case Where 系統只是「使用」已經設定好的 Zoho 郵箱。
                </p>
              </AlertDescription>
            </Alert>

            <div className="bg-white rounded-lg p-4 border border-orange-200">
              <h4 className="font-semibold text-orange-900 mb-3">✅ 正確流程：</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div>
                    <p className="font-medium">前往 Zoho Mail 官方網站</p>
                    <p className="text-sm text-gray-600">在外部設定 Zoho Mail 服務</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div>
                    <p className="font-medium">創建和管理郵箱帳號</p>
                    <p className="text-sm text-gray-600">如 support@casewhr.com、admin@casewhr.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Case Where 系統自動使用</p>
                    <p className="text-sm text-gray-600">系統中的郵件功能會自動使用已設定的郵箱</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 快速訪問按鈕 */}
      <Card>
        <CardHeader>
          <CardTitle>🚀 Zoho Mail 快速訪問</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Zoho Mail 登入 */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <Mail className="h-5 w-5 text-orange-600" />
                <h3 className="font-semibold text-orange-900">Zoho Mail 登入</h3>
              </div>
              <p className="text-sm text-gray-700 mb-3">
                登入查看和管理您的郵箱（support@casewhr.com）
              </p>
              <Button
                className="w-full"
                onClick={() => window.open('https://mail.zoho.com', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                前往 Zoho Mail
              </Button>
            </div>

            {/* Zoho Mail 控制台 */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <Settings className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Zoho 管理控制台</h3>
              </div>
              <p className="text-sm text-gray-700 mb-3">
                管理域名、創建新郵箱、配置 DNS 記錄
              </p>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => window.open('https://mailadmin.zoho.com', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                前往管理控制台
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 常見任務 */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Zoho Mail 常見任務</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* 任務 1：創建新郵箱 */}
            <div className="border rounded-lg">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                onClick={() => toggleSection('create-mailbox')}
              >
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-blue-600" />
                  <div>
                    <h4 className="font-semibold">創建新郵箱（如 admin@casewhr.com）</h4>
                    <p className="text-sm text-gray-600">添加新的郵箱帳號到您的域名</p>
                  </div>
                </div>
                <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${expandedSection === 'create-mailbox' ? 'rotate-90' : ''}`} />
              </button>
              
              {expandedSection === 'create-mailbox' && (
                <div className="p-4 border-t bg-gray-50">
                  <div className="space-y-3">
                    <Alert className="border-blue-200 bg-blue-50">
                      <Info className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-900 text-sm">
                        <strong>📍 操作位置：</strong> Zoho Mail 管理控制台
                      </AlertDescription>
                    </Alert>

                    <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
                      <p className="font-semibold">詳細步驟：</p>
                      <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>登入管理控制台：https://mailadmin.zoho.com</li>
                        <li>點擊左側選單的「<strong>Users</strong>」</li>
                        <li>點擊右上角的「<strong>Add User</strong>」按鈕</li>
                        <li>填寫資訊：
                          <div className="ml-4 mt-1 space-y-1">
                            <p>• Email: <code className="bg-gray-100 px-2 py-0.5 rounded">admin@casewhr.com</code></p>
                            <p>• Display Name: <code className="bg-gray-100 px-2 py-0.5 rounded">Case Where Admin</code></p>
                            <p>• Password: 設定登入密碼</p>
                          </div>
                        </li>
                        <li>點擊「<strong>Create</strong>」</li>
                        <li>確認郵箱創建成功</li>
                      </ol>
                    </div>

                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => window.open('https://mailadmin.zoho.com', '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      前往創建新郵箱
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* 任務 2：查看郵件 */}
            <div className="border rounded-lg">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                onClick={() => toggleSection('check-mail')}
              >
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-green-600" />
                  <div>
                    <h4 className="font-semibold">查看和管理郵件</h4>
                    <p className="text-sm text-gray-600">登入郵箱查看收到的郵件</p>
                  </div>
                </div>
                <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${expandedSection === 'check-mail' ? 'rotate-90' : ''}`} />
              </button>
              
              {expandedSection === 'check-mail' && (
                <div className="p-4 border-t bg-gray-50">
                  <div className="space-y-3">
                    <Alert className="border-green-200 bg-green-50">
                      <Info className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-900 text-sm">
                        <strong>📍 操作位置：</strong> Zoho Mail 登入介面
                      </AlertDescription>
                    </Alert>

                    <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
                      <p className="font-semibold">如何登入：</p>
                      <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>前往：https://mail.zoho.com</li>
                        <li>輸入郵箱地址（如 support@casewhr.com）</li>
                        <li>輸入密碼</li>
                        <li>點擊「Sign In」</li>
                        <li>查看收件箱、發送郵件等</li>
                      </ol>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                      <p className="text-sm text-blue-900">
                        <strong>💡 提示：</strong>您可以在 Zoho Mail 中：
                      </p>
                      <ul className="text-sm text-blue-800 mt-2 space-y-1 ml-4">
                        <li>• 查看從 Brevo 收到的驗證郵件</li>
                        <li>• 接收用戶回覆的郵件</li>
                        <li>• 手動發送郵件</li>
                        <li>• 管理郵件標籤和資料夾</li>
                      </ul>
                    </div>

                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => window.open('https://mail.zoho.com', '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      前往查看郵件
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* 任務 3：配置 DNS */}
            <div className="border rounded-lg">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                onClick={() => toggleSection('dns-config')}
              >
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-purple-600" />
                  <div>
                    <h4 className="font-semibold">配置 DNS 記錄（MX、SPF 等）</h4>
                    <p className="text-sm text-gray-600">設定域名的郵件相關 DNS 記錄</p>
                  </div>
                </div>
                <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${expandedSection === 'dns-config' ? 'rotate-90' : ''}`} />
              </button>
              
              {expandedSection === 'dns-config' && (
                <div className="p-4 border-t bg-gray-50">
                  <div className="space-y-3">
                    <Alert className="border-purple-200 bg-purple-50">
                      <Info className="h-4 w-4 text-purple-600" />
                      <AlertDescription className="text-purple-900 text-sm">
                        <strong>⚠️ 注意：</strong>DNS 記錄通常在域名註冊商處配置（如 Hinet），不是在 Zoho！
                      </AlertDescription>
                    </Alert>

                    <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
                      <p className="font-semibold">Zoho 會提供 DNS 記錄資訊：</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>MX 記錄（用於接收郵件）</li>
                        <li>SPF 記錄（發件人驗證）</li>
                        <li>DKIM 記錄（郵件簽章）</li>
                      </ul>
                      <p className="mt-2 text-gray-700">
                        您需要將這些記錄添加到 Hinet DNS 管理介面中。
                      </p>
                    </div>

                    <div className="bg-orange-50 border border-orange-200 rounded p-3">
                      <p className="text-sm text-orange-900">
                        <strong>💡 建議：</strong>如果您的 DNS 記錄已經正確配置，
                        不需要再次修改。可以前往「DNS 檢查」標籤驗證。
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 任務 4：管理郵箱設定 */}
            <div className="border rounded-lg">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                onClick={() => toggleSection('mailbox-settings')}
              >
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5 text-gray-600" />
                  <div>
                    <h4 className="font-semibold">管理郵箱設定</h4>
                    <p className="text-sm text-gray-600">配置轉發、自動回覆、簽名等</p>
                  </div>
                </div>
                <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${expandedSection === 'mailbox-settings' ? 'rotate-90' : ''}`} />
              </button>
              
              {expandedSection === 'mailbox-settings' && (
                <div className="p-4 border-t bg-gray-50">
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
                      <p className="font-semibold">常用設定：</p>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                          <div>
                            <p className="font-medium">郵件轉發</p>
                            <p className="text-xs text-gray-600">將郵件自動轉發到其他地址</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                          <div>
                            <p className="font-medium">自動回覆</p>
                            <p className="text-xs text-gray-600">設定外出或自動回覆訊息</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                          <div>
                            <p className="font-medium">郵件簽名</p>
                            <p className="text-xs text-gray-600">添加專業的郵件簽名檔</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                          <div>
                            <p className="font-medium">過濾規則</p>
                            <p className="text-xs text-gray-600">自動整理和分類郵件</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      className="w-full"
                      variant="outline"
                      onClick={() => window.open('https://mail.zoho.com', '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      登入設定郵箱
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 當前 Zoho 狀態 */}
      <Card>
        <CardHeader>
          <CardTitle>📊 當前 Zoho Mail 狀態</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <h4 className="font-semibold text-green-900">已配置的郵箱</h4>
              </div>
              <div className="space-y-2">
                <div className="bg-white rounded p-2 flex items-center justify-between">
                  <span className="font-mono text-sm">support@casewhr.com</span>
                  <Badge className="bg-green-500">✅ 已啟用</Badge>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <h4 className="font-semibold text-orange-900">計劃添加的郵箱</h4>
              </div>
              <div className="space-y-2">
                <div className="bg-white rounded p-2 flex items-center justify-between">
                  <span className="font-mono text-sm">admin@casewhr.com</span>
                  <Badge className="bg-orange-500">⚠️ 需要創建</Badge>
                </div>
                <div className="bg-white rounded p-2 flex items-center justify-between">
                  <span className="font-mono text-sm">noreply@casewhr.com</span>
                  <Badge variant="outline">💡 建議添加</Badge>
                </div>
                <div className="bg-white rounded p-2 flex items-center justify-between">
                  <span className="font-mono text-sm">billing@casewhr.com</span>
                  <Badge variant="outline">💡 建議添加</Badge>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Info className="h-5 w-5 text-blue-600" />
                <h4 className="font-semibold text-blue-900">DNS 配置狀態</h4>
              </div>
              <div className="space-y-1 text-sm text-blue-800">
                <p>✅ MX 記錄：已配置（Zoho Mail）</p>
                <p>✅ SPF 記錄：已配置（包含 Brevo）</p>
                <p>✅ DKIM 記錄：已配置（Brevo + Zoho）</p>
                <p>✅ DMARC 記錄：已配置</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 與 Brevo 的關係 */}
      <Card>
        <CardHeader>
          <CardTitle>🔄 Zoho Mail 與 Brevo 的關係</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
              <div className="grid md:grid-cols-2 gap-4">
                {/* Brevo */}
                <div className="bg-white rounded-lg p-3 border border-blue-300">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-blue-100 rounded">
                      <Mail className="h-4 w-4 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-blue-900">Brevo (發送)</h4>
                  </div>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• 負責發送郵件</li>
                    <li>• SMTP 服務</li>
                    <li>• 追蹤發送統計</li>
                    <li>• 郵件模板</li>
                  </ul>
                </div>

                {/* Zoho Mail */}
                <div className="bg-white rounded-lg p-3 border border-orange-300">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-orange-100 rounded">
                      <Mail className="h-4 w-4 text-orange-600" />
                    </div>
                    <h4 className="font-semibold text-orange-900">Zoho Mail (接收)</h4>
                  </div>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• 負責接收郵件</li>
                    <li>• 郵箱管理</li>
                    <li>• 收件箱服務</li>
                    <li>• 手動發送郵件</li>
                  </ul>
                </div>
              </div>
            </div>

            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                <strong>✅ 完美組合：</strong>
                <p className="mt-2 text-sm">
                  Brevo 專注於大量自動發送（註冊確認、通知等），
                  Zoho Mail 提供完整的郵箱功能（接收回覆、管理郵件等）。
                  兩者互補，構成完整的郵件系統！
                </p>
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* 快速檢查清單 */}
      <Card>
        <CardHeader>
          <CardTitle>✅ Zoho Mail 檢查清單</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm">已有 Zoho Mail 帳號</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm">casewhr.com 域名已添加到 Zoho</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm">support@casewhr.com 郵箱已創建</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm">MX 記錄已配置（指向 Zoho）</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-orange-50 rounded">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-sm">admin@casewhr.com 需要創建</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
