/**
 * 🌟 企業版 LOGO 管理面板（管理員專用）
 * 
 * 功能：
 * 1. 查看所有企業客戶的 LOGO
 * 2. 統計企業版使用情況
 * 3. 管理企業 LOGO 設置
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../AuthProvider';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Building2, Image as ImageIcon, Calendar, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { projectId } from '../../utils/supabase/info';

interface EnterpriseLogoInfo {
  userId: string;
  companyName: string;
  logoUrl: string;
  uploadedAt: string;
  lastUpdated: string;
}

interface EnterpriseStats {
  totalEnterpriseClients: number;
  clientsWithLogo: number;
  clientsWithoutLogo: number;
  recentUploads: EnterpriseLogoInfo[];
}

export function EnterpriseLogosAdmin() {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [logos, setLogos] = useState<EnterpriseLogoInfo[]>([]);
  const [stats, setStats] = useState<EnterpriseStats | null>(null);

  useEffect(() => {
    loadEnterpriseLogos();
  }, []);

  const loadEnterpriseLogos = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/admin/enterprise-logos`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setLogos(data.logos || []);
        setStats(data.stats || null);
      } else {
        if (response.status === 403) {
          toast.error('需要管理員權限');
        } else {
          toast.error('加載失敗');
        }
      }
    } catch (error) {
      console.error('Failed to load enterprise logos:', error);
      toast.error('加載失敗');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* 標題區 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">🌟 企業版 LOGO 管理</h2>
          <p className="text-gray-600">查看和管理所有企業客戶的郵件 LOGO</p>
        </div>
        <Button onClick={loadEnterpriseLogos} disabled={loading} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {/* 統計卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">企業版客戶總數</p>
                <p className="text-3xl font-bold text-purple-600">{stats.totalEnterpriseClients}</p>
              </div>
              <Building2 className="w-12 h-12 text-purple-300" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">已設置 LOGO</p>
                <p className="text-3xl font-bold text-green-600">{stats.clientsWithLogo}</p>
              </div>
              <ImageIcon className="w-12 h-12 text-green-300" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">未設置 LOGO</p>
                <p className="text-3xl font-bold text-amber-600">{stats.clientsWithoutLogo}</p>
              </div>
              <ImageIcon className="w-12 h-12 text-amber-300" />
            </div>
          </Card>
        </div>
      )}

      {/* 最近上傳 */}
      {stats && stats.recentUploads.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            最近更新
          </h3>
          <div className="space-y-4">
            {stats.recentUploads.map((info) => (
              <div
                key={info.userId}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="bg-white rounded-lg p-3 border-2 border-gray-200">
                  <img
                    src={info.logoUrl}
                    alt={info.companyName}
                    className="w-24 h-12 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/96x48?text=Logo';
                    }}
                  />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{info.companyName}</p>
                  <p className="text-sm text-gray-500">User ID: {info.userId.substring(0, 8)}...</p>
                  <p className="text-xs text-gray-400 mt-1">
                    更新於 {formatDate(info.lastUpdated)}
                  </p>
                </div>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  Enterprise
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 所有企業 LOGO 列表 */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          所有企業客戶 ({logos.length})
        </h3>

        {logos.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>尚無企業客戶設置 LOGO</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {logos.map((info) => (
              <Card
                key={info.userId}
                className="p-4 hover:shadow-lg transition-shadow border-2 hover:border-purple-200"
              >
                {/* LOGO 展示 */}
                <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg p-6 mb-3">
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                    <img
                      src={info.logoUrl}
                      alt={info.companyName}
                      className="w-full h-16 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x64?text=Logo';
                      }}
                    />
                  </div>
                </div>

                {/* 公司資訊 */}
                <div className="space-y-2">
                  <h4 className="font-semibold truncate">{info.companyName}</h4>
                  <p className="text-xs text-gray-500">ID: {info.userId.substring(0, 12)}...</p>
                  
                  <div className="pt-2 border-t space-y-1">
                    <p className="text-xs text-gray-500">
                      上傳於 {formatDate(info.uploadedAt)}
                    </p>
                    <p className="text-xs text-gray-500">
                      更新於 {formatDate(info.lastUpdated)}
                    </p>
                  </div>

                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 w-full justify-center">
                    Enterprise Client
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* 使用說明 */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-lg mb-3">📋 管理說明</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-blue-600">•</span>
            <span>此頁面顯示所有企業版用戶的郵件 LOGO 設置</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600">•</span>
            <span>企業版用戶可以在設定頁面自行上傳和管理 LOGO</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600">•</span>
            <span>LOGO 會自動顯示在該用戶收到的所有系統郵件中</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600">•</span>
            <span>如需協助企業客戶設置 LOGO，請聯繫技術支援</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}