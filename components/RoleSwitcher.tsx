import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { projectId } from "../utils/supabase/info";
import { toast } from "sonner";
import { Loader2, UserCog } from "lucide-react";

export function RoleSwitcher() {
  const { user, profile, accessToken, refreshProfile } = useAuth();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(profile?.is_client ?? false);
  const [isFreelancer, setIsFreelancer] = useState(profile?.is_freelancer ?? false);

  const handleUpdate = async () => {
    if (!user?.id || !accessToken) return;

    // At least one role must be selected
    if (!isClient && !isFreelancer) {
      toast.error(language === 'en' ? 'Please select at least one role' : '請至少選擇一個角色');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/profile`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            is_client: isClient,
            is_freelancer: isFreelancer,
          }),
        }
      );

      if (response.ok) {
        toast.success(language === 'en' ? 'Roles updated successfully!' : '角色更新成功！');
        // Refresh profile to get updated data
        await refreshProfile();
      } else {
        const error = await response.json();
        toast.error(error.message || (language === 'en' ? 'Failed to update roles' : '更新角色失敗'));
      }
    } catch (error) {
      console.error('Error updating roles:', error);
      toast.error(language === 'en' ? 'Failed to update roles' : '更新角色失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-2 border-purple-200 bg-purple-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-900">
          <UserCog className="h-5 w-5" />
          {language === 'en' ? 'Role Switcher' : '角色切換器'}
        </CardTitle>
        <CardDescription>
          {language === 'en' 
            ? 'Switch between Client and Freelancer roles. You can be both!' 
            : '在案主和接案者角色之間切換。您可以同時擁有兩個角色！'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Roles */}
        <div className="bg-white p-4 rounded-lg space-y-3">
          <h3 className="font-medium text-sm text-gray-700">
            {language === 'en' ? 'Current Roles:' : '目前角色：'}
          </h3>
          <div className="flex gap-2">
            {profile?.is_client && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {language === 'en' ? '👔 Client' : '👔 案主'}
              </span>
            )}
            {profile?.is_freelancer && (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                {language === 'en' ? '💼 Freelancer' : '💼 接案者'}
              </span>
            )}
            {!profile?.is_client && !profile?.is_freelancer && (
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                {language === 'en' ? 'No roles selected' : '未選擇角色'}
              </span>
            )}
          </div>
        </div>

        {/* Role Toggles */}
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="client-role" className="text-base font-medium">
                👔 {language === 'en' ? 'Client (Post Projects)' : '案主（發布項目）'}
              </Label>
              <p className="text-sm text-gray-500">
                {language === 'en' 
                  ? 'Can post projects and hire freelancers' 
                  : '可以發布項目並雇用接案者'}
              </p>
            </div>
            <Switch
              id="client-role"
              checked={isClient}
              onCheckedChange={setIsClient}
            />
          </div>

          <div className="flex items-center justify-between bg-white p-4 rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="freelancer-role" className="text-base font-medium">
                💼 {language === 'en' ? 'Freelancer (Accept Work)' : '接案者（接受工作）'}
              </Label>
              <p className="text-sm text-gray-500">
                {language === 'en' 
                  ? 'Can browse projects and submit proposals' 
                  : '可以瀏覽項目並提交提案'}
              </p>
            </div>
            <Switch
              id="freelancer-role"
              checked={isFreelancer}
              onCheckedChange={setIsFreelancer}
            />
          </div>
        </div>

        {/* Info Alert */}
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-sm text-blue-800">
          <p className="font-medium mb-1">
            💡 {language === 'en' ? 'Pro Tip:' : '專業提示：'}
          </p>
          <p>
            {language === 'en' 
              ? 'Enable both roles to test the full platform experience! You can switch back anytime.' 
              : '啟用兩個角色以測試完整的平台體驗！您可以隨時切換回來。'}
          </p>
        </div>

        {/* Update Button */}
        <Button
          onClick={handleUpdate}
          disabled={loading || (isClient === profile?.is_client && isFreelancer === profile?.is_freelancer)}
          className="w-full"
        >
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {language === 'en' ? 'Update Roles' : '更新角色'}
        </Button>
      </CardContent>
    </Card>
  );
}