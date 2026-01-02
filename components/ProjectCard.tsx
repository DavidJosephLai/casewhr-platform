import { memo, useCallback, useMemo } from 'react'; // ✅ Added React hooks
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Calendar, DollarSign, User, Briefcase } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { translations, getTranslation } from "../lib/translations";
import { formatCurrency, formatCurrencyRange, Currency, getDefaultCurrency, convertCurrency } from "../lib/currency";

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  budget_min: number;
  budget_max: number;
  budget_type: "fixed" | "hourly";
  currency?: Currency;
  deadline: string | null;
  required_skills: string;
  status: "open" | "in_progress" | "completed" | "cancelled";
  client_id: string;
  client_name: string;
  client_email: string;
  proposal_count: number;
  created_at: string;
  updated_at: string;
}

interface ProjectCardProps {
  project: Project;
  onViewDetails: () => void;
}

export const ProjectCard = memo(function ProjectCard({ project, onViewDetails }: ProjectCardProps) {
  const { language } = useLanguage();
  const t = getTranslation(language as any).projects;

  // ✅ Memoize formatBudget function
  const formatBudget = useCallback((project: Project) => {
    // ⭐ 項目存儲的貨幣（預設 TWD，符合系統規範）
    const storedCurrency = project.currency || 'TWD';
    // 根據語言決定顯示貨幣：中文顯示 TWD，英文顯示 USD
    const displayCurrency = getDefaultCurrency(language);
    
    // 轉換金額
    const minAmount = storedCurrency === displayCurrency 
      ? project.budget_min 
      : convertCurrency(project.budget_min, storedCurrency, displayCurrency);
    const maxAmount = storedCurrency === displayCurrency 
      ? project.budget_max 
      : convertCurrency(project.budget_max, storedCurrency, displayCurrency);
    
    if (project.budget_type === 'hourly') {
      return `${formatCurrency(minAmount, displayCurrency)} - ${formatCurrency(maxAmount, displayCurrency)}/hr`;
    }
    
    return formatCurrencyRange(minAmount, maxAmount, displayCurrency);
  }, [language]);

  // ✅ Memoize formatDeadline function
  const formatDeadline = useCallback(() => {
    if (!project.deadline) {
      return language === 'en' ? 'Flexible' : '靈活';
    }
    
    const date = new Date(project.deadline);
    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, [project.deadline, language]);

  // ✅ Memoize getStatusColor function
  const getStatusColor = useCallback(() => {
    switch (project.status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, [project.status]);

  // ✅ Memoize skills parsing
  const skills = useMemo(() => 
    project.required_skills
      ? project.required_skills.split(',').map(s => s.trim()).filter(Boolean)
      : [],
    [project.required_skills]
  );

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <h3 className="flex-1 line-clamp-2">{project.title}</h3>
          <Badge className={getStatusColor()}>
            {t.statuses[project.status]}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 line-clamp-3 mt-2">
          {project.description}
        </p>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="space-y-3">
          {/* Budget */}
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <span className="text-gray-700">
              <span className="font-semibold">{t.card.budget}:</span> {formatBudget(project)}
            </span>
          </div>

          {/* Category */}
          <div className="flex items-center gap-2 text-sm">
            <Briefcase className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <span className="text-gray-700">{project.category}</span>
          </div>

          {/* Deadline */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <span className="text-gray-700">
              <span className="font-semibold">{t.card.deadline}:</span> {formatDeadline()}
            </span>
          </div>

          {/* Posted By */}
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <span className="text-gray-700">
              <span className="font-semibold">{t.card.postedBy}:</span> {project.client_name || project.client_email}
            </span>
          </div>

          {/* Skills */}
          {skills.length > 0 && (
            <div className="pt-2">
              <p className="text-sm font-semibold text-gray-700 mb-2">{t.card.skills}:</p>
              <div className="flex flex-wrap gap-1.5">
                {skills.slice(0, 5).map((skill, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {skills.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{skills.length - 5}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-2 pt-4 border-t">
        <span className="text-sm text-gray-600">
          {project.proposal_count} {t.card.proposals}
        </span>
        <Button onClick={onViewDetails} size="sm">
          {t.card.viewDetails}
        </Button>
      </CardFooter>
    </Card>
  );
});