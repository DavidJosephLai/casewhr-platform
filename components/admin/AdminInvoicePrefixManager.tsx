import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Alert, AlertDescription } from '../ui/alert';
import { toast } from 'sonner';
import { FileText, Calendar, Settings, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { useLanguage } from '../../lib/LanguageContext';

// Helper function to create auth headers with dev token support
function createAuthHeaders(accessToken: string | null): HeadersInit {
  const headers: HeadersInit = {};
  
  if (accessToken?.startsWith('dev-user-')) {
    // Dev mode: Use publicAnonKey for Authorization, dev token in X-Dev-Token
    headers['Authorization'] = `Bearer ${publicAnonKey}`;
    headers['X-Dev-Token'] = accessToken;
    console.log('[AdminInvoicePrefixManager] Dev mode: Using publicAnonKey for auth, dev token in X-Dev-Token header');
  } else if (accessToken) {
    // Production mode: Use access token
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  headers['Content-Type'] = 'application/json';
  return headers;
}

interface InvoicePrefix {
  yearMonth: string;
  prefix: string;
  numberStart?: string; // 8-digit number start
}

interface AdminInvoicePrefixManagerProps {
  accessToken: string | null;
}

export function AdminInvoicePrefixManager({ accessToken }: AdminInvoicePrefixManagerProps) {
  const { language } = useLanguage();
  const [prefixes, setPrefixes] = useState<InvoicePrefix[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // 表單狀態
  const [newPrefix, setNewPrefix] = useState('');
  const [newNumberStart, setNewNumberStart] = useState('');
  const [yearMonth, setYearMonth] = useState('');
  const [currentMonthPrefix, setCurrentMonthPrefix] = useState<string | null>(null);
  const [currentMonthNumberStart, setCurrentMonthNumberStart] = useState<string | null>(null);

  const translations = {
    en: {
      title: 'Invoice Prefix Management',
      description: 'Set monthly invoice prefix (10-digit Track Number) for E-Invoice system',
      currentMonth: 'Current Month',
      yearMonth: 'Year-Month',
      prefix: 'Track Number',
      newPrefix: 'Letter Prefix (2 letters)',
      numberStart: 'Number Start (8 digits)',
      setPrefix: 'Set Track Number',
      setting: 'Setting...',
      prefixHistory: 'Track Number History',
      noPrefixes: 'No track numbers set yet',
      letterFormat: 'Format: 2 uppercase letters (e.g., AB, XY)',
      numberFormat: 'Format: 8 digits (e.g., 00000001, 12345678)',
      yearMonthFormat: 'Format: YYYY-MM (e.g., 2025-01)',
      currentPrefixSet: 'Current month track number is set',
      currentPrefixNotSet: 'Current month track number not set - invoices will use random prefix',
      success: 'Invoice track number set successfully',
      error: 'Failed to set invoice track number',
      invalidFormat: 'Invalid format',
      prefixRequired: 'Letter prefix is required',
      numberRequired: 'Number start is required',
      yearMonthRequired: 'Year-Month is required',
      fullTrackNumber: 'Full Track Number (10 digits)',
    },
    'zh-TW': {
      title: '發票字軌頭管理',
      description: '設定每月電子發票字軌頭（10 碼發票號碼前綴）',
      currentMonth: '本月',
      yearMonth: '年月',
      prefix: '字軌號碼',
      newPrefix: '英文字軌（2 碼）',
      numberStart: '數字開頭（8 碼）',
      setPrefix: '設定字軌號碼',
      setting: '設定中...',
      prefixHistory: '字軌號碼歷史記錄',
      noPrefixes: '尚未設定任何字軌號碼',
      letterFormat: '格式：兩位大寫英文字母（例如：AB、XY）',
      numberFormat: '格式：8 位數字（例如：00000001、12345678）',
      yearMonthFormat: '格式：YYYY-MM（例如：2025-01）',
      currentPrefixSet: '本月字軌號碼已設定',
      currentPrefixNotSet: '本月字軌號碼未設定 - 發票將使用隨機字軌',
      success: '發票字軌號碼設定成功',
      error: '發票字軌號碼設定失敗',
      invalidFormat: '格式無效',
      prefixRequired: '請輸入英文字軌',
      numberRequired: '請輸入數字開頭',
      yearMonthRequired: '請選擇年月',
      fullTrackNumber: '完整字軌號碼（10 碼）',
    },
    'zh-CN': {
      title: '发票字轨头管理',
      description: '设定每月电子发票字轨头（10 码发票号码前缀）',
      currentMonth: '本月',
      yearMonth: '年月',
      prefix: '字轨号码',
      newPrefix: '英文字轨（2 码）',
      numberStart: '数字开头（8 码）',
      setPrefix: '设定字轨号码',
      setting: '设定中...',
      prefixHistory: '字轨号码历史记录',
      noPrefixes: '尚未设定任何字轨号码',
      letterFormat: '格式：两位大写英文字母（例如：AB、XY）',
      numberFormat: '格式：8 位数字（例如：00000001、12345678）',
      yearMonthFormat: '格式：YYYY-MM（例如：2025-01）',
      currentPrefixSet: '本月字轨号码已设定',
      currentPrefixNotSet: '本月字轨号码未设定 - 发票将使用随机字轨',
      success: '发票字轨号码设定成功',
      error: '发票字轨号码设定失败',
      invalidFormat: '格式无效',
      prefixRequired: '请输入英文字轨',
      numberRequired: '请输入数字开头',
      yearMonthRequired: '请选择年月',
      fullTrackNumber: '完整字轨号码（10 码）',
    },
  };

  const t = translations[language as keyof typeof translations] || translations.en;

  useEffect(() => {
    // 設置預設年月為當前月份
    const now = new Date();
    const currentYearMonth = now.toISOString().slice(0, 7);
    setYearMonth(currentYearMonth);
    
    if (accessToken) {
      loadPrefixes();
      loadCurrentMonthPrefix(currentYearMonth);
    }
  }, [accessToken]);

  const loadPrefixes = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/invoices/prefixes`,
        {
          headers: createAuthHeaders(accessToken),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load prefixes');
      }

      const data = await response.json();
      setPrefixes(data.prefixes || []);
    } catch (error) {
      console.error('Error loading prefixes:', error);
      toast.error(t.error);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentMonthPrefix = async (yearMonth: string) => {
    if (!accessToken) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/invoices/prefix/${yearMonth}`,
        {
          headers: createAuthHeaders(accessToken),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCurrentMonthPrefix(data.prefix);
        setCurrentMonthNumberStart(data.numberStart);
      }
    } catch (error) {
      console.error('Error loading current month prefix:', error);
    }
  };

  const handleSetPrefix = async () => {
    if (!accessToken) return;

    // 驗證輸入
    if (!newPrefix.trim()) {
      toast.error(t.prefixRequired);
      return;
    }

    if (!yearMonth) {
      toast.error(t.yearMonthRequired);
      return;
    }

    // 驗證格式：必須是兩位大寫字母
    const prefixUpper = newPrefix.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(prefixUpper)) {
      toast.error(t.invalidFormat);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/invoices/set-prefix`,
        {
          method: 'POST',
          headers: createAuthHeaders(accessToken),
          body: JSON.stringify({
            prefix: prefixUpper,
            yearMonth: yearMonth,
            numberStart: newNumberStart,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set prefix');
      }

      toast.success(t.success);
      setNewPrefix('');
      setNewNumberStart('');
      
      // 重新載入資料
      await loadPrefixes();
      
      // 如果設定的是當月，更新當月字軌頭顯示
      const currentYearMonth = new Date().toISOString().slice(0, 7);
      if (yearMonth === currentYearMonth) {
        setCurrentMonthPrefix(prefixUpper);
        setCurrentMonthNumberStart(newNumberStart);
      }
    } catch (error: any) {
      console.error('Error setting prefix:', error);
      toast.error(error.message || t.error);
    } finally {
      setSaving(false);
    }
  };

  const formatYearMonth = (ym: string) => {
    const [year, month] = ym.split('-');
    if (language === 'en') {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[parseInt(month) - 1]} ${year}`;
    }
    return `${year} 年 ${month} 月`;
  };

  const currentYearMonth = new Date().toISOString().slice(0, 7);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-purple-900">{t.title}</CardTitle>
              <CardDescription className="text-purple-700">
                {t.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Current Month Status */}
      <Alert className={currentMonthPrefix ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
        <div className="flex items-start gap-3">
          {currentMonthPrefix ? (
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4" />
              <span className="font-semibold">{t.currentMonth}: {formatYearMonth(currentYearMonth)}</span>
            </div>
            <AlertDescription>
              {currentMonthPrefix ? (
                <div className="text-green-700">
                  <div>{t.currentPrefixSet}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm">{t.fullTrackNumber}:</span>
                    <Badge className="bg-green-600 text-white text-lg px-3 py-1 font-mono">
                      {currentMonthPrefix}{currentMonthNumberStart || '########'}
                    </Badge>
                  </div>
                </div>
              ) : (
                <span className="text-yellow-700">{t.currentPrefixNotSet}</span>
              )}
            </AlertDescription>
          </div>
        </div>
      </Alert>

      {/* Set Prefix Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t.setPrefix}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="yearMonth">{t.yearMonth}</Label>
              <Input
                id="yearMonth"
                type="month"
                value={yearMonth}
                onChange={(e) => setYearMonth(e.target.value)}
                className="text-lg"
              />
              <p className="text-sm text-gray-500">{t.yearMonthFormat}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prefix">{t.newPrefix}</Label>
              <Input
                id="prefix"
                type="text"
                value={newPrefix}
                onChange={(e) => setNewPrefix(e.target.value.toUpperCase())}
                placeholder="AB"
                maxLength={2}
                className="text-2xl font-bold tracking-widest text-center uppercase"
              />
              <p className="text-sm text-gray-500">{t.letterFormat}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numberStart">{t.numberStart}</Label>
              <Input
                id="numberStart"
                type="text"
                value={newNumberStart}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                  setNewNumberStart(value);
                }}
                placeholder="00000001"
                maxLength={8}
                className="text-2xl font-bold tracking-widest text-center"
              />
              <p className="text-sm text-gray-500">{t.numberFormat}</p>
            </div>
          </div>

          <Button 
            onClick={handleSetPrefix}
            disabled={saving || !newPrefix.trim() || !yearMonth}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t.setting}
              </>
            ) : (
              <>
                <Settings className="h-4 w-4 mr-2" />
                {t.setPrefix}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Prefix History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t.prefixHistory}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : prefixes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t.noPrefixes}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.yearMonth}</TableHead>
                    <TableHead>{t.prefix}</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prefixes.map((item) => {
                    const isCurrent = item.yearMonth === currentYearMonth;
                    const fullTrackNumber = `${item.prefix}${item.numberStart || '########'}`;
                    return (
                      <TableRow key={item.yearMonth} className={isCurrent ? 'bg-green-50' : ''}>
                        <TableCell className="font-medium">
                          {formatYearMonth(item.yearMonth)}
                          {isCurrent && (
                            <Badge variant="outline" className="ml-2 bg-green-100 text-green-700 border-green-300">
                              {t.currentMonth}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className="text-xl px-4 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-mono tracking-wider">
                            {fullTrackNumber}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {isCurrent && (
                            <Badge className="bg-green-600 text-white">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}