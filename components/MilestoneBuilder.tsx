import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useLanguage } from "../lib/LanguageContext";
import { Plus, Trash2, Target, DollarSign, Calendar } from "lucide-react";
import { formatCurrency, type Currency } from "../lib/currency";
import { toast } from "sonner"; // ✅ 移除版本号

export interface Milestone {
  id?: string;
  title: string;
  description: string;
  amount: number;
  duration_days?: number;
  order?: number;
}

interface MilestoneBuilderProps {
  totalBudget: number;
  currency: Currency;
  onChange: (milestones: Milestone[]) => void;
  initialMilestones?: Milestone[];
}

export function MilestoneBuilder({
  totalBudget,
  currency,
  onChange,
  initialMilestones = [],
}: MilestoneBuilderProps) {
  const { language } = useLanguage();
  const [milestones, setMilestones] = useState<Milestone[]>(
    initialMilestones.length > 0 ? initialMilestones : []
  );

  useEffect(() => {
    onChange(milestones);
  }, [milestones]);

  const addMilestone = () => {
    const remainingBudget =
      totalBudget - milestones.reduce((sum, m) => sum + (m.amount || 0), 0);

    if (remainingBudget <= 0 && totalBudget > 0) {
      const errorMsg =
        language === "en"
          ? "Total budget has been allocated"
          : language === "zh-CN"
          ? "总预算已分配完毕"
          : "總預算已分配完畢";
      toast.error(errorMsg);
      return;
    }

    const newMilestone: Milestone = {
      id: crypto.randomUUID(),
      title: "",
      description: "",
      amount: remainingBudget > 0 ? remainingBudget : 0,
      duration_days: 7,
      order: milestones.length + 1,
    };

    setMilestones([...milestones, newMilestone]);
  };

  const removeMilestone = (index: number) => {
    const updated = milestones.filter((_, i) => i !== index);
    setMilestones(
      updated.map((m, i) => ({
        ...m,
        order: i + 1,
      }))
    );
  };

  const updateMilestone = (index: number, field: keyof Milestone, value: any) => {
    const updated = [...milestones];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setMilestones(updated);
  };

  const allocatedAmount = milestones.reduce(
    (sum, m) => sum + (m.amount || 0),
    0
  );
  const remainingAmount = totalBudget - allocatedAmount;

  const t = {
    en: {
      title: "Milestone Planning",
      addMilestone: "Add Milestone",
      milestoneTitle: "Milestone Title",
      description: "Description",
      amount: "Amount",
      duration: "Duration (days)",
      remove: "Remove",
      totalBudget: "Total Budget",
      allocated: "Allocated",
      remaining: "Remaining",
      titlePlaceholder: "e.g., Initial Design Concepts",
      descriptionPlaceholder: "Describe what will be delivered in this milestone...",
      noMilestones: "No milestones added yet",
      noMilestonesDesc: "Click 'Add Milestone' to create your first milestone",
    },
    zh: {
      title: "里程碑規劃",
      addMilestone: "新增里程碑",
      milestoneTitle: "里程碑標題",
      description: "描述",
      amount: "金額",
      duration: "天數",
      remove: "移除",
      totalBudget: "總預算",
      allocated: "已分配",
      remaining: "剩餘",
      titlePlaceholder: "例如：初步設計概念",
      descriptionPlaceholder: "描述此里程碑將交付的內容...",
      noMilestones: "尚未新增里程碑",
      noMilestonesDesc: "點擊「新增里程碑」以建立第一個里程碑",
    },
  };

  const text = language === "en" ? t.en : t.zh;

  return (
    <div className="space-y-4">
      {/* Header with Budget Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-blue-600" />
            {text.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-gray-600 flex items-center gap-1 mb-1">
                <DollarSign className="h-3 w-3" />
                {text.totalBudget}
              </div>
              <div className="text-lg font-bold">
                {formatCurrency(totalBudget, currency)}
              </div>
            </div>
            <div>
              <div className="text-gray-600 mb-1">{text.allocated}</div>
              <div className="text-lg font-bold text-blue-600">
                {formatCurrency(allocatedAmount, currency)}
              </div>
            </div>
            <div>
              <div className="text-gray-600 mb-1">{text.remaining}</div>
              <div
                className={`text-lg font-bold ${
                  remainingAmount < 0
                    ? "text-red-600"
                    : remainingAmount === 0
                    ? "text-green-600"
                    : "text-gray-900"
                }`}
              >
                {formatCurrency(remainingAmount, currency)}
              </div>
            </div>
          </div>

          {remainingAmount !== 0 && totalBudget > 0 && (
            <div
              className={`mt-3 text-xs ${
                remainingAmount < 0 ? "text-red-600" : "text-yellow-600"
              }`}
            >
              {remainingAmount < 0
                ? language === "en"
                  ? "⚠️ Allocated amount exceeds total budget"
                  : "⚠️ 已分配金額超過總預算"
                : language === "en"
                ? "ℹ️ You have remaining budget to allocate"
                : "ℹ️ 您還有剩餘預算可以分配"}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Milestones List */}
      {milestones.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-gray-900 font-medium mb-1">{text.noMilestones}</h3>
          <p className="text-sm text-gray-500">{text.noMilestonesDesc}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {milestones.map((milestone, index) => (
            <Card key={index} className="border-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <CardTitle className="text-base">
                      {language === "en" ? "Milestone" : "里程碑"} {index + 1}
                    </CardTitle>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMilestone(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    {text.remove}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor={`milestone-title-${index}`}>
                    {text.milestoneTitle} *
                  </Label>
                  <Input
                    id={`milestone-title-${index}`}
                    value={milestone.title}
                    onChange={(e) =>
                      updateMilestone(index, "title", e.target.value)
                    }
                    placeholder={text.titlePlaceholder}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor={`milestone-description-${index}`}>
                    {text.description}
                  </Label>
                  <Textarea
                    id={`milestone-description-${index}`}
                    value={milestone.description}
                    onChange={(e) =>
                      updateMilestone(index, "description", e.target.value)
                    }
                    placeholder={text.descriptionPlaceholder}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`milestone-amount-${index}`}>
                      {text.amount} ({currency}) *
                    </Label>
                    <Input
                      id={`milestone-amount-${index}`}
                      type="number"
                      value={milestone.amount || ""}
                      onChange={(e) =>
                        updateMilestone(
                          index,
                          "amount",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      min="0"
                      step="any"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor={`milestone-duration-${index}`}>
                      <Calendar className="h-3 w-3 inline mr-1" />
                      {text.duration}
                    </Label>
                    <Input
                      id={`milestone-duration-${index}`}
                      type="number"
                      value={milestone.duration_days || ""}
                      onChange={(e) =>
                        updateMilestone(
                          index,
                          "duration_days",
                          parseInt(e.target.value) || 0
                        )
                      }
                      min="1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Milestone Button */}
      <Button
        type="button"
        variant="outline"
        onClick={addMilestone}
        className="w-full border-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400"
      >
        <Plus className="h-4 w-4 mr-2" />
        {text.addMilestone}
      </Button>
    </div>
  );
}