import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useView } from '../contexts/ViewContext';
import { copyToClipboard } from '../utils/clipboard';
import { 
  Book, 
  Code, 
  Play,
  Copy,
  Check,
  Terminal,
  Zap,
  Lock,
  Clock,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';

interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  auth: 'api-key' | 'bearer';
  category: string;
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  requestBody?: {
    [key: string]: {
      type: string;
      required: boolean;
      description: string;
    };
  };
  response: any;
}

interface ApiDocumentationProps {
  language?: 'en' | 'zh' | 'zh-TW' | 'zh-CN';
  apiKey?: string;
  baseUrl: string;
}

export function ApiDocumentation({ language = 'en', apiKey, baseUrl }: ApiDocumentationProps) {
  const { setView } = useView();
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<'curl' | 'javascript' | 'python'>('curl');
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [testParams, setTestParams] = useState<{ [key: string]: any }>({});

  const translations = {
    en: {
      title: 'API Documentation',
      subtitle: 'Complete reference for the Case Where Enterprise API',
      backToDashboard: 'Back to Dashboard',
      quickStart: 'Quick Start',
      authentication: 'Authentication',
      rateLimit: 'Rate Limiting',
      endpoints: 'API Endpoints',
      tryIt: 'Try It Out',
      testing: 'Testing...',
      method: 'Method',
      path: 'Path',
      auth: 'Authentication',
      parameters: 'Parameters',
      requestBody: 'Request Body',
      response: 'Response',
      example: 'Example',
      codeExample: 'Code Example',
      testEndpoint: 'Test Endpoint',
      result: 'Result',
      copy: 'Copy',
      copied: 'Copied!',
      required: 'Required',
      optional: 'Optional',
      name: 'Name',
      type: 'Type',
      description: 'Description',
      categories: {
        public: 'Public API',
        keys: 'API Keys',
        support: 'Support',
        team: 'Team Management',
        manager: 'Account Manager',
        branding: 'Branding'
      },
      authTypes: {
        'api-key': 'API Key',
        'bearer': 'Bearer Token'
      },
      quickStartText: 'Get started with the Case Where API in minutes. All Enterprise users have access to our comprehensive API.',
      authText: 'All API requests require authentication. Use your API Key for public endpoints or Bearer Token for management endpoints.',
      rateLimitText: 'Enterprise users have a rate limit of 100 requests per minute. Rate limit headers are included in all responses.'
    },
    zh: {
      title: 'API 文檔',
      subtitle: 'Case Where 企業版 API 完整參考',
      backToDashboard: '返回儀表板',
      quickStart: '快速開始',
      authentication: '認證',
      rateLimit: '速率限制',
      endpoints: 'API 端點',
      tryIt: '試試看',
      testing: '測試中...',
      method: '方法',
      path: '路徑',
      auth: '認證方式',
      parameters: '參數',
      requestBody: '請求內容',
      response: '響應',
      example: '範例',
      codeExample: '代碼示例',
      testEndpoint: '測試端點',
      result: '結果',
      copy: '複製',
      copied: '已複製！',
      required: '必填',
      optional: '選填',
      name: '名稱',
      type: '類型',
      description: '說明',
      categories: {
        public: '公開 API',
        keys: 'API 金鑰',
        support: '支援',
        team: '團隊管理',
        manager: '客戶經理',
        branding: '品牌設置'
      },
      authTypes: {
        'api-key': 'API 金鑰',
        'bearer': 'Bearer Token'
      },
      quickStartText: '幾分鐘內開始使用 Case Where API。所有企業版用戶都可以使用我們完整的 API。',
      authText: '所有 API 請求都需要認證。公開端點使用 API 金鑰，管理端點使用 Bearer Token。',
      rateLimitText: '企業版用戶的速率限制為每分鐘 100 次請求。所有響應都包含速率限制標頭。'
    },
    'zh-TW': {
      title: 'API 文件',
      subtitle: 'Case Where 企業版 API 完整參考',
      backToDashboard: '返回儀表板',
      quickStart: '快速開始',
      authentication: '認證',
      rateLimit: '速率限制',
      endpoints: 'API 端點',
      tryIt: '試試看',
      testing: '測試中...',
      method: '方法',
      path: '路徑',
      auth: '認證方式',
      parameters: '參數',
      requestBody: '請求內容',
      response: '響應',
      example: '範例',
      codeExample: '代碼範例',
      testEndpoint: '測試端點',
      result: '結果',
      copy: '複��',
      copied: '已複製！',
      required: '必填',
      optional: '選填',
      name: '名稱',
      type: '類型',
      description: '說明',
      categories: {
        public: '公開 API',
        keys: 'API 金鑰',
        support: '支援',
        team: '團隊管理',
        manager: '客戶經理',
        branding: '品牌設置'
      },
      authTypes: {
        'api-key': 'API 金鑰',
        'bearer': 'Bearer Token'
      },
      quickStartText: '幾分鐘內開始使用 Case Where API。所有企業版用戶都可以使用我們完整的 API。',
      authText: '所有 API 請求都需要認證。公開端點使用 API 金鑰，管理端點使用 Bearer Token。',
      rateLimitText: '企業版用戶的速率限制為每分鐘 100 次請求。所有響應都包含速率限制標頭。'
    },
    'zh-CN': {
      title: 'API 文档',
      subtitle: 'Case Where 企业版 API 完整参考',
      backToDashboard: '返回仪表板',
      quickStart: '快速开始',
      authentication: '认证',
      rateLimit: '速率限制',
      endpoints: 'API 端点',
      tryIt: '试一试',
      testing: '测试中...',
      method: '方法',
      path: '路径',
      auth: '认证方式',
      parameters: '参数',
      requestBody: '请求内容',
      response: '响应',
      example: '示例',
      codeExample: '代码示例',
      testEndpoint: '测试端点',
      result: '结果',
      copy: '复制',
      copied: '已复制！',
      required: '必填',
      optional: '选填',
      name: '名称',
      type: '类型',
      description: '说明',
      categories: {
        public: '公开 API',
        keys: 'API 密钥',
        support: '支持',
        team: '团队管理',
        manager: '客户经理',
        branding: '品牌设置'
      },
      authTypes: {
        'api-key': 'API 密钥',
        'bearer': 'Bearer Token'
      },
      quickStartText: '几分钟内开始使用 Case Where API。所有企业版用户都可以使用我们的完整 API。',
      authText: '所有 API 请求都需要认证。公开端点使用 API 密钥，管理端点使用 Bearer Token。',
      rateLimitText: '企业版用户的速率限制为每分钟 100 次请求。所有响应都包含速率限制标头。'
    }
  };

  const t = translations[language];

  const endpoints: ApiEndpoint[] = [
    // Public API
    {
      method: 'GET',
      path: '/api/v1/projects',
      description: language === 'en' ? 'Get list of your projects' : '獲取項目列表',
      auth: 'api-key',
      category: 'public',
      response: {
        success: true,
        data: [
          {
            id: 'proj-123',
            title: 'Website Redesign',
            budget: 5000,
            status: 'open'
          }
        ],
        meta: {
          total: 1,
          api_version: 'v1'
        }
      }
    },
    {
      method: 'POST',
      path: '/api/v1/projects',
      description: language === 'en' ? 'Create a new project' : '創建新項目',
      auth: 'api-key',
      category: 'public',
      requestBody: {
        title: { type: 'string', required: true, description: 'Project title' },
        description: { type: 'string', required: true, description: 'Project description' },
        budget: { type: 'number', required: false, description: 'Project budget' },
        deadline: { type: 'string', required: false, description: 'Deadline (ISO 8601)' },
        skills: { type: 'array', required: false, description: 'Required skills' }
      },
      response: {
        success: true,
        data: {
          id: 'proj-uuid',
          title: 'Website Redesign',
          status: 'open',
          created_at: '2025-12-13T10:00:00Z'
        }
      }
    },
    {
      method: 'GET',
      path: '/api/v1/wallet',
      description: language === 'en' ? 'Get wallet balance' : '查詢錢包餘額',
      auth: 'api-key',
      category: 'public',
      response: {
        success: true,
        data: {
          balance: 1500.50,
          locked: 200.00,
          currency: 'USD'
        }
      }
    },
    {
      method: 'GET',
      path: '/api/v1/proposals',
      description: language === 'en' ? 'Get list of proposals' : '獲取提案列表',
      auth: 'api-key',
      category: 'public',
      parameters: [
        { name: 'project_id', type: 'string', required: false, description: 'Filter by project ID' },
        { name: 'status', type: 'string', required: false, description: 'Filter by status' }
      ],
      response: {
        success: true,
        data: [
          {
            id: 'prop-123',
            project_id: 'proj-123',
            proposed_amount: 4500,
            status: 'pending'
          }
        ]
      }
    },
    {
      method: 'POST',
      path: '/api/v1/proposals',
      description: language === 'en' ? 'Submit a new proposal' : '提交新提案',
      auth: 'api-key',
      category: 'public',
      requestBody: {
        project_id: { type: 'string', required: true, description: 'Project ID' },
        cover_letter: { type: 'string', required: true, description: 'Cover letter' },
        proposed_amount: { type: 'number', required: true, description: 'Proposed amount' },
        delivery_time: { type: 'string', required: false, description: 'Delivery time' }
      },
      response: {
        success: true,
        data: {
          id: 'prop-uuid',
          status: 'pending',
          created_at: '2025-12-13T10:00:00Z'
        }
      }
    }
  ];

  const generateCodeExample = (endpoint: ApiEndpoint) => {
    const { method, path, requestBody } = endpoint;
    const fullUrl = `${baseUrl}${path}`;

    if (selectedLanguage === 'curl') {
      let curl = `curl -X ${method} ${fullUrl} \\\n`;
      curl += `  -H "X-API-Key: ${apiKey || 'your-api-key'}"`;
      
      if (requestBody) {
        curl += ` \\\n  -H "Content-Type: application/json" \\\n`;
        const example: any = {};
        Object.entries(requestBody).forEach(([key, value]) => {
          if (value.type === 'string') example[key] = 'example';
          if (value.type === 'number') example[key] = 100;
          if (value.type === 'array') example[key] = ['example'];
        });
        curl += `  -d '${JSON.stringify(example, null, 2)}'`;
      }
      
      return curl;
    }

    if (selectedLanguage === 'javascript') {
      let js = `const response = await fetch('${fullUrl}', {\n`;
      js += `  method: '${method}',\n`;
      js += `  headers: {\n`;
      js += `    'X-API-Key': '${apiKey || 'your-api-key'}'`;
      
      if (requestBody) {
        js += `,\n    'Content-Type': 'application/json'\n  },\n`;
        const example: any = {};
        Object.entries(requestBody).forEach(([key, value]) => {
          if (value.type === 'string') example[key] = 'example';
          if (value.type === 'number') example[key] = 100;
          if (value.type === 'array') example[key] = ['example'];
        });
        js += `  body: JSON.stringify(${JSON.stringify(example, null, 4)})\n`;
      } else {
        js += `\n  }\n`;
      }
      
      js += `});\n\nconst data = await response.json();\nconsole.log(data);`;
      return js;
    }

    if (selectedLanguage === 'python') {
      let py = `import requests\n\n`;
      py += `response = requests.${method.toLowerCase()}(\n`;
      py += `    '${fullUrl}',\n`;
      py += `    headers={'X-API-Key': '${apiKey || 'your-api-key'}'}`;
      
      if (requestBody) {
        const example: any = {};
        Object.entries(requestBody).forEach(([key, value]) => {
          if (value.type === 'string') example[key] = 'example';
          if (value.type === 'number') example[key] = 100;
          if (value.type === 'array') example[key] = ['example'];
        });
        py += `,\n    json=${JSON.stringify(example, null, 4).replace(/"/g, "'")}`;
      }
      
      py += `\n)\n\ndata = response.json()\nprint(data)`;
      return py;
    }

    return '';
  };

  const handleCopy = (text: string) => {
    copyToClipboard(text);
    setCopied(true);
    toast.success(t.copied);
    setTimeout(() => setCopied(false), 2000);
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-blue-100 text-blue-800';
      case 'POST': return 'bg-green-100 text-green-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const groupedEndpoints = endpoints.reduce((acc, endpoint) => {
    if (!acc[endpoint.category]) {
      acc[endpoint.category] = [];
    }
    acc[endpoint.category].push(endpoint);
    return acc;
  }, {} as { [key: string]: ApiEndpoint[] });

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button 
        variant="outline" 
        onClick={() => setView('dashboard')}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="size-4" />
        {t.backToDashboard}
      </Button>

      {/* Header */}
      <Card className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Book className="size-6 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-2xl">{t.title}</CardTitle>
              <CardDescription className="mt-1">{t.subtitle}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Start Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="size-5 text-green-600" />
              <h4 className="font-semibold">{t.quickStart}</h4>
            </div>
            <p className="text-sm text-gray-600">{t.quickStartText}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="size-5 text-blue-600" />
              <h4 className="font-semibold">{t.authentication}</h4>
            </div>
            <p className="text-sm text-gray-600">{t.authText}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="size-5 text-purple-600" />
              <h4 className="font-semibold">{t.rateLimit}</h4>
            </div>
            <p className="text-sm text-gray-600">{t.rateLimitText}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Endpoints List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">{t.endpoints}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(groupedEndpoints).map(([category, categoryEndpoints]) => (
              <div key={category}>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">
                  {t.categories[category as keyof typeof t.categories]}
                </h4>
                <div className="space-y-1">
                  {categoryEndpoints.map((endpoint, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedEndpoint(endpoint)}
                      className={`w-full text-left p-2 rounded text-sm transition-colors ${
                        selectedEndpoint === endpoint
                          ? 'bg-indigo-100 border border-indigo-300'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Badge className={getMethodColor(endpoint.method)}>
                          {endpoint.method}
                        </Badge>
                        <span className="text-xs font-mono truncate">
                          {endpoint.path}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Endpoint Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedEndpoint ? (
                <div className="flex items-center gap-2">
                  <Badge className={getMethodColor(selectedEndpoint.method)}>
                    {selectedEndpoint.method}
                  </Badge>
                  <span className="font-mono text-base">{selectedEndpoint.path}</span>
                </div>
              ) : (
                language === 'en' ? 'Select an endpoint' : '選擇一個端點'
              )}
            </CardTitle>
            {selectedEndpoint && (
              <CardDescription>{selectedEndpoint.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {selectedEndpoint ? (
              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">
                    {language === 'en' ? 'Overview' : '概覽'}
                  </TabsTrigger>
                  <TabsTrigger value="code">{t.codeExample}</TabsTrigger>
                  <TabsTrigger value="try">{t.tryIt}</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                  {/* Authentication */}
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Lock className="size-4" />
                      {t.auth}
                    </h4>
                    <Badge variant="outline">
                      {t.authTypes[selectedEndpoint.auth]}
                    </Badge>
                  </div>

                  {/* Parameters */}
                  {selectedEndpoint.parameters && selectedEndpoint.parameters.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">{t.parameters}</h4>
                      <div className="border rounded overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="text-left p-2">{t.name}</th>
                              <th className="text-left p-2">{t.type}</th>
                              <th className="text-left p-2">{t.description}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedEndpoint.parameters.map((param, i) => (
                              <tr key={i} className="border-t">
                                <td className="p-2 font-mono">
                                  {param.name}
                                  {param.required && (
                                    <Badge className="ml-1 text-xs bg-red-100 text-red-800">
                                      {t.required}
                                    </Badge>
                                  )}
                                </td>
                                <td className="p-2 text-gray-600">{param.type}</td>
                                <td className="p-2 text-gray-600">{param.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Request Body */}
                  {selectedEndpoint.requestBody && (
                    <div>
                      <h4 className="font-semibold mb-2">{t.requestBody}</h4>
                      <div className="border rounded overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="text-left p-2">{t.name}</th>
                              <th className="text-left p-2">{t.type}</th>
                              <th className="text-left p-2">{t.description}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(selectedEndpoint.requestBody).map(([key, value], i) => (
                              <tr key={i} className="border-t">
                                <td className="p-2 font-mono">
                                  {key}
                                  {value.required && (
                                    <Badge className="ml-1 text-xs bg-red-100 text-red-800">
                                      {t.required}
                                    </Badge>
                                  )}
                                </td>
                                <td className="p-2 text-gray-600">{value.type}</td>
                                <td className="p-2 text-gray-600">{value.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Response */}
                  <div>
                    <h4 className="font-semibold mb-2">{t.response}</h4>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-x-auto">
                      {JSON.stringify(selectedEndpoint.response, null, 2)}
                    </pre>
                  </div>
                </TabsContent>

                {/* Code Example Tab */}
                <TabsContent value="code" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Select value={selectedLanguage} onValueChange={(v: any) => setSelectedLanguage(v)}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="curl">cURL</SelectItem>
                        <SelectItem value="javascript">JavaScript</SelectItem>
                        <SelectItem value="python">Python</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(generateCodeExample(selectedEndpoint))}
                    >
                      {copied ? (
                        <>
                          <Check className="size-4 mr-2" />
                          {t.copied}
                        </>
                      ) : (
                        <>
                          <Copy className="size-4 mr-2" />
                          {t.copy}
                        </>
                      )}
                    </Button>
                  </div>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-x-auto">
                    {generateCodeExample(selectedEndpoint)}
                  </pre>
                </TabsContent>

                {/* Try It Tab */}
                <TabsContent value="try" className="space-y-4">
                  {!apiKey ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-4 flex items-start gap-2">
                      <AlertCircle className="size-5 text-yellow-600 shrink-0 mt-0.5" />
                      <p className="text-sm text-yellow-800">
                        {language === 'en' 
                          ? 'You need to create an API Key first to test endpoints.'
                          : '您需要先創建 API 金鑰才能測試端點。'}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm text-gray-600">
                        {language === 'en'
                          ? 'Test this endpoint with your API key. Results will appear below.'
                          : '使用您的 API 金鑰測試此端點。結果將顯示在下方。'}
                      </div>
                      
                      <Button
                        onClick={() => {/* TODO: Implement test */}}
                        disabled={testing}
                        className="w-full"
                      >
                        {testing ? (
                          <>
                            <span className="animate-spin mr-2">⏳</span>
                            {t.testing}
                          </>
                        ) : (
                          <>
                            <Play className="size-4 mr-2" />
                            {t.testEndpoint}
                          </>
                        )}
                      </Button>

                      {testResult && (
                        <div>
                          <h4 className="font-semibold mb-2">{t.result}</h4>
                          <pre className="bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-x-auto">
                            {JSON.stringify(testResult, null, 2)}
                          </pre>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Terminal className="size-12 mx-auto mb-4 text-gray-400" />
                <p>{language === 'en' ? 'Select an endpoint to view details' : '選擇一個端點查看詳情'}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}