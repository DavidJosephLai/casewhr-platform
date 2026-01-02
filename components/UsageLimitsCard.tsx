import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { FileText, Send, AlertCircle } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { translations, getTranslation } from "../lib/translations";
import { useSubscription } from "../hooks/useSubscription";
import { Loader2 } from "lucide-react";

export function UsageLimitsCard() {
  const { language } = useLanguage();
  const t = getTranslation(language).subscription;
  const { limits, loading } = useSubscription();

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  if (!limits) {
    return null;
  }

  // Backend uses -1 for unlimited, convert to Infinity for easier handling
  const projectsLimit = limits.limits.projects === -1 ? Infinity : limits.limits.projects;
  const proposalsLimit = limits.limits.proposals === -1 ? Infinity : limits.limits.proposals;

  const projectsPercentage = projectsLimit === Infinity 
    ? 0 
    : (limits.usage.projects / projectsLimit) * 100;
  
  const proposalsPercentage = proposalsLimit === Infinity 
    ? 0 
    : (limits.usage.proposals / proposalsLimit) * 100;

  const isProjectLimitClose = projectsPercentage >= 80;
  const isProposalLimitClose = proposalsPercentage >= 80;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>
              {language === 'en' ? 'Monthly Usage' : '本月使用情況'}
            </CardTitle>
            <CardDescription className="mt-1">
              {language === 'en' ? 'Track your monthly limits' : '追蹤您的月度限額'}
            </CardDescription>
          </div>
          <Badge variant="outline">
            {t.plans[limits.plan].name}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Projects Usage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">
                {language === 'en' ? 'Project Postings' : '項目發布'}
              </span>
            </div>
            <span className="text-sm text-gray-600">
              {limits.usage.projects} / {projectsLimit === Infinity ? '∞' : projectsLimit}
            </span>
          </div>
          {projectsLimit !== Infinity && (
            <>
              <Progress value={projectsPercentage} className="h-2" />
              {isProjectLimitClose && (
                <div className="flex items-center gap-1 mt-2 text-xs text-orange-600">
                  <AlertCircle className="h-3 w-3" />
                  {language === 'en' 
                    ? 'Approaching limit' 
                    : '接近限額'}
                </div>
              )}
            </>
          )}
          {projectsLimit === Infinity && (
            <div className="text-xs text-green-600 mt-1">
              ✓ {language === 'en' ? 'Unlimited' : '無限制'}
            </div>
          )}
        </div>

        {/* Proposals Usage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">
                {language === 'en' ? 'Proposal Submissions' : '提案提交'}
              </span>
            </div>
            <span className="text-sm text-gray-600">
              {limits.usage.proposals} / {proposalsLimit === Infinity ? '∞' : proposalsLimit}
            </span>
          </div>
          {proposalsLimit !== Infinity && (
            <>
              <Progress value={proposalsPercentage} className="h-2" />
              {isProposalLimitClose && (
                <div className="flex items-center gap-1 mt-2 text-xs text-orange-600">
                  <AlertCircle className="h-3 w-3" />
                  {language === 'en' 
                    ? 'Approaching limit' 
                    : '接近限額'}
                </div>
              )}
            </>
          )}
          {proposalsLimit === Infinity && (
            <div className="text-xs text-green-600 mt-1">
              ✓ {language === 'en' ? 'Unlimited' : '無限制'}
            </div>
          )}
        </div>

        {/* Plan Info */}
        <div className="pt-4 border-t">
          <p className="text-xs text-gray-500">
            {language === 'en' 
              ? 'Limits reset on the 1st of each month' 
              : '限額於每月 1 號重置'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}