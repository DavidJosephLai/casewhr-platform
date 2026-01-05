import { useLanguage } from "../lib/LanguageContext";
import { getTranslation } from "../lib/translations";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Code, Palette, PenTool, TrendingUp, Video, Smartphone, BarChart, Headphones, Calculator, Scale, Users, Building2, X } from "lucide-react";

const categoryIcons = {
  'development': Code,
  'design': Palette,
  'content': PenTool,
  'marketing': TrendingUp,
  'video': Video,
  'business': Smartphone,
  'data': BarChart,
  'support': Headphones,
  'finance': Calculator,
  'legal': Scale,
  'hr': Users,
  'other': Building2,
};

interface CategorySelectorProps {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  className?: string;
}

export function CategorySelector({ value, onChange, multiple = false, className = "" }: CategorySelectorProps) {
  const { language } = useLanguage();
  const categories = getTranslation(language as any).categories.items;

  // Convert value to array for easier handling
  const selectedCategories = Array.isArray(value) ? value : (value ? [value] : []);

  const handleCategoryToggle = (categoryValue: string) => {
    if (multiple) {
      // Multiple selection mode
      const newSelection = selectedCategories.includes(categoryValue)
        ? selectedCategories.filter(c => c !== categoryValue)
        : [...selectedCategories, categoryValue];
      onChange(newSelection);
    } else {
      // Single selection mode
      onChange(categoryValue);
    }
  };

  const handleRemoveCategory = (categoryValue: string) => {
    if (multiple) {
      const newSelection = selectedCategories.filter(c => c !== categoryValue);
      onChange(newSelection);
    } else {
      onChange('');
    }
  };

  return (
    <div className={className}>
      <Label className="mb-3 block">
        {language === 'en' 
          ? `Professional ${multiple ? 'Categories' : 'Category'}` 
          : `專業類別 ${multiple ? '（可多選）' : ''}`}
      </Label>
      
      {/* Selected Categories Display */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          {selectedCategories.map((categoryValue) => {
            const category = categories.find(c => c.value === categoryValue);
            const Icon = categoryIcons[categoryValue as keyof typeof categoryIcons] || Building2;
            
            return (
              <Badge
                key={categoryValue}
                variant="secondary"
                className="px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 cursor-pointer flex items-center gap-2"
                onClick={() => handleRemoveCategory(categoryValue)}
              >
                <Icon className="h-3 w-3" />
                <span>{category?.title || categoryValue}</span>
                <X className="h-3 w-3 ml-1" />
              </Badge>
            );
          })}
        </div>
      )}

      {/* Category Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
        {categories.map((category) => {
          const Icon = categoryIcons[category.value as keyof typeof categoryIcons] || Building2;
          const isSelected = selectedCategories.includes(category.value);

          return (
            <Card
              key={category.value}
              className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                isSelected 
                  ? 'border-2 border-blue-600 bg-blue-50' 
                  : 'border border-gray-200 hover:border-blue-400'
              }`}
              onClick={() => handleCategoryToggle(category.value)}
            >
              <div className="flex items-start gap-3">
                {multiple && (
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleCategoryToggle(category.value)}
                    className="mt-1"
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`h-5 w-5 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                    <h4 className={`text-sm font-semibold ${isSelected ? 'text-blue-600' : 'text-gray-900'}`}>
                      {category.title}
                    </h4>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {category.description}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Helper Text */}
      <p className="text-xs text-gray-500 mt-3">
        {multiple 
          ? (language === 'en' 
              ? 'Select one or more categories that best describe your expertise.' 
              : '選擇一個或多個最能描述您專業領域的類別。')
          : (language === 'en' 
              ? 'Select the category that best describes your primary expertise.' 
              : '選擇最能描述您主要專業領域的類別。')
        }
      </p>
    </div>
  );
}
