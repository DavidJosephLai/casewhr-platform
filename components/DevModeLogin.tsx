/**
 * 🧪 开发模式登录组件
 * 
 * 用于在 Figma Make 等开发环境中绕过 Supabase 认证
 * 仅在开发环境显示，生产环境自动隐藏
 * 
 * 使用场景：
 * - Figma Make 预览测试
 * - 本地开发测试
 * - 演示和展示
 */

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { useState, useEffect } from "react";
import { toast } from "sonner@2.0.3";
import { createClient } from "@supabase/supabase-js";
import { Shield, AlertTriangle, Zap } from "lucide-react";

interface DevModeLoginProps {
  onDevLogin?: (user: any) => void;
}

export function DevModeLogin({ onDevLogin }: DevModeLoginProps) {
  const [devEmail, setDevEmail] = useState('davidlai117@yahoo.com.tw'); // 🔥 改為特殊用戶郵箱
  const [devName, setDevName] = useState('David Lai'); // 🔥 改為對應名稱
  const [accountType, setAccountType] = useState<'client' | 'freelancer'>('client');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCard, setShowCard] = useState(false);

  // 🔥 快速切换用户预设
  const userPresets = [
    { email: 'davidlai117@yahoo.com.tw', name: 'David Lai', type: 'client' as const, desc: '案主 (發布項目)' },
    { email: 'davidlai234@hotmail.com', name: 'David Lai', type: 'freelancer' as const, desc: '自由工作者 (接案)' },
  ];

  // 🔥 快速切换用户函数
  const quickSwitch = (preset: typeof userPresets[0]) => {
    setDevEmail(preset.email);
    setDevName(preset.name);
    setAccountType(preset.type);
    console.log('🔄 [DevModeLogin] Quick switch to:', preset);
  };
  
  // 检测是否在开发环境
  const isDevelopment = 
    window.location.hostname === 'localhost' ||
    window.location.hostname.includes('figma') ||
    window.location.hostname.includes('127.0.0.1') ||
    window.location.hostname.includes('preview') ||
    import.meta.env.DEV;
  
  // 检查是否有 Supabase 连接错误
  useEffect(() => {
    if (isDevelopment) {
      // 🔥 立即顯示開發模式卡片，不需要等待
      setShowCard(true);
      console.log('🧪 [DevModeLogin] Dev mode card is now visible');
    }
  }, [isDevelopment]);
  
  // 生产环境不显示
  if (!isDevelopment && !showCard) {
    return null;
  }
  
  // 🔧 生成基於 email 的穩定用戶 ID（確保同一 email 每次登錄 ID 相同）
  const generateStableUserId = (email: string): string => {
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      const char = email.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `dev-user-${Math.abs(hash)}`;
  };

  const handleDevLogin = () => {
    // 🔥 清除舊的 localStorage 數據，確保重新生成帶 user_id 的項目
    console.log('🧹 [DevModeLogin] Clearing old dev mode data...');
    localStorage.removeItem('dev_mode_projects');
    localStorage.removeItem('dev_mode_user');
    localStorage.removeItem('dev_profile');
    localStorage.removeItem('dev_token');
    localStorage.removeItem('dev_subscription');
    
    // 🔧 生成基於郵箱的穩定用戶 ID（修復切換帳號後的問題）
    const emailHash = devEmail.split('@')[0].split('').reduce((hash, char) => {
      return ((hash << 5) - hash) + char.charCodeAt(0);
    }, 0);
    const userId = `dev-user-${Math.abs(emailHash)}`;

    // 🔥 特殊用戶處理：davidlai117@yahoo.com.tw 和 davidlai234@hotmail.com 自動設為雙重身份
    const isSpecialUser = devEmail === 'davidlai117@yahoo.com.tw' || devEmail === 'davidlai234@hotmail.com';
    const finalAccountType = isSpecialUser ? 'both' : accountType; // 特殊用戶自動為 both

    const mockUser = {
      id: userId,
      email: devEmail,
      user_metadata: {
        name: devName,
        account_type: finalAccountType, // 🔥 保存帳戶類型
        // 🔧 新增：支持雙角色系統
        is_client: finalAccountType === 'client' || finalAccountType === 'both',
        is_freelancer: finalAccountType === 'freelancer' || finalAccountType === 'both',
      }
    };
    
    console.log('🧪 [DevModeLogin] Logging in with dev user:', mockUser);
    localStorage.setItem('dev_mode_user', JSON.stringify(mockUser));
    
    // 🔥 創建完整的開發模式 profile（避免重定向到註冊頁面）
    const mockProfile = {
      id: userId,
      user_id: userId,
      email: devEmail,
      full_name: devName,
      is_client: finalAccountType === 'client' || finalAccountType === 'both',
      is_freelancer: finalAccountType === 'freelancer' || finalAccountType === 'both',
      account_type: finalAccountType, // 🔥 同時設置 account_type
      profile_complete: true, // 🔥 標記為已完成註冊
      // 🔥 特殊用戶獲得企業版訂閱
      subscription_tier: isSpecialUser ? 'enterprise' : 'free',
      subscription_status: isSpecialUser ? 'active' : 'inactive',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem('dev_mode_profile', JSON.stringify(mockProfile));
    console.log('👤 [DevModeLogin] Dev profile created:', mockProfile);
    
    // 🔥 創建開發模式專用 token（格式：dev-user-{id}||{email}）
    const devToken = `${userId}||${devEmail}`;
    console.log('🔑 [DevModeLogin] Dev token created:', devToken);
    
    // 🔥 創建 Supabase 風格的 token 據結構（供 AuthContext 使用）
    const tokenData = {
      currentSession: {
        access_token: devToken,
        refresh_token: `dev-refresh-${userId}`,
        expires_in: 3600,
        expires_at: Date.now() + 3600000,
        user: mockUser,
      }
    };
    localStorage.setItem('supabase.auth.token', JSON.stringify(tokenData));
    console.log('🔑 [DevModeLogin] Dev token created:', devToken);
    
    // 🔥 同時儲存簡單的 dev_mode_token 供其他組件使用
    localStorage.setItem('dev_mode_token', devToken);
    
    // 🔥 為特殊用戶創建企業版訂閱信息
    if (isSpecialUser) {
      const mockSubscription = {
        id: `sub-${userId}`,
        user_id: userId,
        plan: 'enterprise',
        status: 'active',
        billing_cycle: 'yearly',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        limits: {
          projects: 999999, // 企業版無限項目
          proposals: 999999, // 企業版無限提案
          team_members: 999999, // 企業版無限團隊成員
          api_calls: 999999, // 企業版無限 API 調用
        },
        features: {
          priority_support: true,
          custom_branding: true,
          api_access: true,
          sla_guarantee: true,
          dedicated_manager: true,
        },
      };
      localStorage.setItem('dev_mode_subscription', JSON.stringify(mockSubscription));
      console.log('💎 [DevModeLogin] Enterprise subscription created:', mockSubscription);
    }
    
    // 🔥 創建 mock 項目數據（用於開發模式測試）
    const mockProjects = [
      {
        id: 'mock-project-1',
        user_id: userId,
        title: '電商網站開發',
        description: '需要開發一個完整的電商平台，包含購物車、結帳、訂單管理等功能',
        budget_min: 30000,
        budget_max: 50000,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        required_skills: ['React', 'Node.js', 'PostgreSQL'],
        category: 'Web Development',
        status: 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        proposal_count: 3,
        pending_proposal_count: 2,
      },
      {
        id: 'mock-project-2',
        user_id: userId,
        title: 'iOS App 設計與開發',
        description: '開發一款健身追蹤 iOS App，需要包含運動記錄、數據分析等功能',
        budget_min: 60000,
        budget_max: 80000,
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        required_skills: ['Swift', 'iOS', 'UI/UX'],
        category: 'Mobile Development',
        status: 'in_progress',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        proposal_count: 1,
      },
      {
        id: 'mock-project-3',
        user_id: userId,
        title: 'AI 聊天機器人開發',
        description: '需要整合 OpenAI API，打造智能客服系統',
        budget_min: 40000,
        budget_max: 70000,
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        required_skills: ['Python', 'OpenAI', 'NLP'],
        category: 'AI & Machine Learning',
        status: 'open',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        proposal_count: 5,
        pending_proposal_count: 3,
      },
      {
        id: 'mock-project-4',
        user_id: userId,
        title: 'UI/UX 設計重構',
        description: '需要為現有產品進行完整的 UI/UX 設計改版',
        budget_min: 25000,
        budget_max: 40000,
        deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        required_skills: ['Figma', 'UI Design', 'UX Research'],
        category: 'Design',
        status: 'pending_review',
        created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        proposal_count: 1,
      },
      {
        id: 'mock-project-5',
        user_id: userId,
        title: '數據分析儀表板',
        description: '建立企業級數據可視化儀表板，支援即時數據更新',
        budget_min: 50000,
        budget_max: 80000,
        deadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(),
        required_skills: ['React', 'D3.js', 'Data Visualization'],
        category: 'Data Science',
        status: 'pending_payment',
        created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        proposal_count: 1,
      },
      {
        id: 'mock-project-6',
        user_id: userId,
        title: 'React 網站',
        description: '使用 React + TypeScript 開發現代化企業官網，需要 RWD 響應式設計',
        budget_min: 35000,
        budget_max: 55000,
        deadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
        required_skills: ['React', 'TypeScript', 'Tailwind CSS'],
        category: 'Web Development',
        status: 'completed',
        created_at: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        proposal_count: 1,
      },
    ];
    localStorage.setItem('dev_mode_projects', JSON.stringify(mockProjects));
    console.log('📦 [DevModeLogin] Created', mockProjects.length, 'mock projects for dev mode');
    
    // 🔥 設置開發模式啟用標記
    localStorage.setItem('dev_mode_active', 'true');
    
    // 🔥 觸發自訂事件，通知 AuthContext 重新檢查 session
    window.dispatchEvent(new CustomEvent('devModeLogin', { detail: mockUser }));
    
    toast.success('🧪 開發模式登錄成功！');
    
    if (onDevLogin) {
      onDevLogin(mockUser);
    }
    
    // 🔥 刷新頁面以應用新的用戶狀
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };
  
  const handleDevLogout = () => {
    console.log('🧪 [DevMode] 开发模式登出...');
    
    // 清除所有认证数据
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('dev_mode_user');
    localStorage.removeItem('dev_mode_profile');
    localStorage.removeItem('dev_mode_token'); // 🔥 清除開發模式 token
    localStorage.removeItem('dev_mode_active');
    localStorage.removeItem('dev_mode_subscription'); // 🔥 清除訂閱信息
    localStorage.removeItem('dev_mode_wallet'); // 🔥 清除錢包信息
    
    toast.info('🧪 已退出开发模式');
    
    // 刷新页面
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };
  
  // 检查是否已经登录
  const isDevModeActive = localStorage.getItem('dev_mode_active') === 'true';
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px', // 🔧 改為左下角,避免與聊天氣泡衝突
      zIndex: 9999,
    }}>
      <Card className="p-4 shadow-2xl border-4 border-yellow-500 bg-yellow-50" style={{ minWidth: '280px' }}>
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-5 w-5 text-yellow-600" />
          <h3 className="font-bold text-yellow-900">🧪 开发模式</h3>
        </div>
        
        {!isDevModeActive ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2 p-2 bg-yellow-100 rounded text-xs">
              <AlertTriangle className="h-4 w-4 text-yellow-700 flex-shrink-0 mt-0.5" />
              <p className="text-yellow-800">
                仅在开发环境可用<br />
                生产环境自动隐藏
              </p>
            </div>
            
            <div className="space-y-2">
              <div>
                <Label className="text-xs">姓名</Label>
                <Input
                  value={devName}
                  onChange={(e) => setDevName(e.target.value)}
                  className="h-8 text-sm"
                  placeholder="测试用户"
                />
              </div>
              
              <div>
                <Label className="text-xs">邮箱</Label>
                <Input
                  value={devEmail}
                  onChange={(e) => setDevEmail(e.target.value)}
                  className="h-8 text-sm"
                  placeholder="dev@casewhr.com"
                />
              </div>

              {/* 🔥 快速切换用户按钮 */}
              <div>
                <Label className="text-xs mb-1 block">快速切换</Label>
                <div className="grid grid-cols-2 gap-2">
                  {userPresets.map((preset, index) => (
                    <Button
                      key={index}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-auto py-1.5 px-2 text-xs"
                      onClick={() => quickSwitch(preset)}
                    >
                      <div className="text-left">
                        <div>{preset.type === 'client' ? '👔' : '💼'}</div>
                        <div className="text-xs opacity-70">{preset.desc}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-xs">账户类型</Label>
                <select
                  value={accountType}
                  onChange={(e) => {
                    const newType = e.target.value as 'client' | 'freelancer';
                    console.log('🔄 [DevModeLogin] Account type changed:', newType);
                    setAccountType(newType);
                  }}
                  className="w-full h-8 text-sm border rounded px-2 bg-white cursor-pointer"
                  style={{ appearance: 'auto' }}
                >
                  <option value="client">👔 客户 (发布项目)</option>
                  <option value="freelancer">💼 自由工作者 (接案)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  当前选择: {accountType === 'client' ? '👔 客户' : '💼 自由工作者'}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="dev-admin"
                  checked={isAdmin}
                  onChange={(e) => setIsAdmin(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="dev-admin" className="text-xs cursor-pointer">
                  管理员权限
                </Label>
              </div>
            </div>
            
            <Button
              onClick={handleDevLogin}
              className="w-full h-8 text-sm bg-yellow-600 hover:bg-yellow-700"
            >
              <Zap className="h-4 w-4 mr-1" />
              快速登录
            </Button>
            
            <p className="text-xs text-gray-600 text-center">
              绕过 Supabase 认证
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-2 bg-green-100 rounded text-xs">
              <p className="text-green-800 font-medium">✅ 开发模式已激活</p>
              <p className="text-green-700 mt-1">
                {localStorage.getItem('dev_mode_user') && 
                  JSON.parse(localStorage.getItem('dev_mode_user')!).email}
              </p>
            </div>
            
            <Button
              onClick={handleDevLogout}
              variant="outline"
              className="w-full h-8 text-sm"
            >
              退出开发模式
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}