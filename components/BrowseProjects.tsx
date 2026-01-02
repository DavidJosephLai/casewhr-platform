import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { Checkbox } from "./ui/checkbox";
import { Search, Filter, X, ChevronDown, SlidersHorizontal } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { translations, getTranslation } from "../lib/translations";
import { ProjectList } from "./ProjectList";
import { Badge } from "./ui/badge";

export function BrowseProjects() {
  const { language } = useLanguage();
  const t = getTranslation(language).projects;
  const categories = getTranslation(language).categories.items;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("open");
  const [sortBy, setSortBy] = useState<string>("newest"); // 新增排序狀態
  const [budgetMin, setBudgetMin] = useState<string>(""); // 新增預算篩選
  const [budgetMax, setBudgetMax] = useState<string>("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false); // 進階篩選開關

  // Listen for navigation events from category cards
  useEffect(() => {
    const handleNavigateToProjects = (e: CustomEvent) => {
      console.log('🎯 [BrowseProjects] Navigation event received:', e.detail);
      
      // Scroll to projects section
      const projectsSection = document.getElementById('projects');
      if (projectsSection) {
        projectsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      
      // Apply filters from navigation - UPDATE rather than RESET
      if (e.detail.category) {
        // Only update category, keep existing skills if they're valid for the new category
        const newCategory = e.detail.category;
        const newCategorySkills = categories.find(cat => cat.value === newCategory)?.skills || [];
        
        // Filter existing skills to only keep those valid in the new category
        const validSkills = selectedSkills.filter(skill => newCategorySkills.includes(skill));
        
        setSelectedCategory(newCategory);
        if (validSkills.length !== selectedSkills.length) {
          setSelectedSkills(validSkills); // Only update if some skills became invalid
        }
      }
      
      if (e.detail.skill) {
        // If skill is clicked, find which category it belongs to
        const categoryForSkill = categories.find(cat => 
          cat.skills && cat.skills.includes(e.detail.skill)
        );
        
        if (categoryForSkill) {
          setSelectedCategory(categoryForSkill.value);
          // Add skill to existing selection instead of replacing
          if (!selectedSkills.includes(e.detail.skill)) {
            setSelectedSkills(prev => [...prev, e.detail.skill]);
          }
        }
      }
    };

    window.addEventListener('navigateToProjects', handleNavigateToProjects as EventListener);
    
    return () => {
      window.removeEventListener('navigateToProjects', handleNavigateToProjects as EventListener);
    };
  }, [categories, selectedSkills]);

  // Get skills based on selected category
  const availableSkills = selectedCategory === "all" 
    ? Array.from(new Set(categories.flatMap(cat => cat.skills || []))).sort()
    : (categories.find(cat => cat.value === selectedCategory)?.skills || []);

  // When category changes, reset skill filter if selected skills are not in the new category
  const handleCategoryChange = (newCategory: string) => {
    console.log('🔄 [BrowseProjects] Category changed:', {
      from: selectedCategory,
      to: newCategory
    });
    setSelectedCategory(newCategory);
    // If skills are selected, filter out skills not available in the new category
    if (selectedSkills.length > 0) {
      const newAvailableSkills = newCategory === "all"
        ? Array.from(new Set(categories.flatMap(cat => cat.skills || [])))
        : (categories.find(cat => cat.value === newCategory)?.skills || []);
      
      const validSkills = selectedSkills.filter(skill => newAvailableSkills.includes(skill));
      console.log('🔄 [BrowseProjects] Skills reset:', {
        oldSkills: selectedSkills,
        newSkills: validSkills
      });
      setSelectedSkills(validSkills);
    }
  };

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedSkills([]);
    setSelectedStatus("open");
    setSortBy("newest");
    setBudgetMin("");
    setBudgetMax("");
    setShowAdvancedFilters(false);
  };

  const hasActiveFilters = searchQuery || selectedCategory !== "all" || selectedSkills.length > 0 || sortBy !== "newest" || budgetMin || budgetMax;

  return (
    <section id="projects" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="mb-4">{t.browseTitle || t.browseProjects}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t.browseSubtitle || (language === 'en' 
              ? 'Find projects that match your skills and interests'
              : '尋找符合您技能和興趣的項目')}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder={language === 'en' ? 'Search projects...' : '搜尋項目...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder={t.form.categoryPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="all" value="all">
                    {language === 'en' ? 'All Categories' : '所有類別'}
                  </SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Skill Filter */}
            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                  >
                    <span>
                      {selectedSkills.length > 0
                        ? `${selectedSkills.length} ${language === 'en' ? 'skills selected' : '個技能已選'}`
                        : language === 'en' ? 'Select Skills' : '選擇技能'}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 max-h-80 overflow-y-auto" align="start">
                  <div className="space-y-2">
                    {/* Select All Option */}
                    <div className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded">
                      <Checkbox
                        id="all-skills"
                        checked={selectedSkills.length === availableSkills.length && availableSkills.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedSkills(availableSkills);
                          } else {
                            setSelectedSkills([]);
                          }
                        }}
                      />
                      <label
                        htmlFor="all-skills"
                        className="text-sm font-medium leading-none cursor-pointer flex-1"
                      >
                        {language === 'en' ? 'All Skills' : '所有技能'}
                      </label>
                    </div>

                    <div className="border-t pt-2">
                      {availableSkills.map((skill, index) => (
                        <div key={index} className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded">
                          <Checkbox
                            id={`skill-${index}`}
                            checked={selectedSkills.includes(skill)}
                            onCheckedChange={() => handleSkillToggle(skill)}
                          />
                          <label
                            htmlFor={`skill-${index}`}
                            className="text-sm leading-none cursor-pointer flex-1"
                          >
                            {skill}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Status Filter */}
            <div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'en' ? 'Status' : '狀態'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="open" value="open">{t.status.open}</SelectItem>
                  <SelectItem key="in_progress" value="in_progress">{t.status.in_progress}</SelectItem>
                  <SelectItem key="completed" value="completed">{t.status.completed}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 智能排序和進階篩選 */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 智能排序 */}
            <div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'en' ? 'Sort By' : '排序方式'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">
                    {language === 'en' ? '📅 Newest First' : '📅 最新發布'}
                  </SelectItem>
                  <SelectItem value="oldest">
                    {language === 'en' ? '⏰ Oldest First' : '⏰ 最舊發布'}
                  </SelectItem>
                  <SelectItem value="budget_high">
                    {language === 'en' ? '💰 Highest Budget' : '💰 預算最高'}
                  </SelectItem>
                  <SelectItem value="budget_low">
                    {language === 'en' ? '💵 Lowest Budget' : '💵 預算最低'}
                  </SelectItem>
                  <SelectItem value="deadline_soon">
                    {language === 'en' ? '⏳ Deadline Soon' : '⏳ 截止最近'}
                  </SelectItem>
                  <SelectItem value="deadline_far">
                    {language === 'en' ? '📆 Deadline Far' : '📆 截止最遠'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 進階篩選按鈕 */}
            <div className="md:col-span-2">
              <Button
                variant="outline"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="w-full"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                {language === 'en' ? 'Advanced Filters' : '進階篩選'}
                {showAdvancedFilters ? ' ▲' : ' ▼'}
              </Button>
            </div>
          </div>

          {/* 進階篩選面板 */}
          {showAdvancedFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold mb-3">
                {language === 'en' ? '💼 Budget Range' : '💼 預算範圍'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">
                    {language === 'en' ? 'Minimum Budget' : '最低預算'}
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(e.target.value)}
                    min="0"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">
                    {language === 'en' ? 'Maximum Budget' : '最高預算'}
                  </label>
                  <Input
                    type="number"
                    placeholder={language === 'en' ? 'No limit' : '無上限'}
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                    min="0"
                  />
                </div>
              </div>
              {(budgetMin || budgetMax) && (
                <p className="text-xs text-gray-500 mt-2">
                  {language === 'en' 
                    ? `Filtering projects between $${budgetMin || '0'} - $${budgetMax || '∞'}` 
                    : `篩選預算範圍：$${budgetMin || '0'} - $${budgetMax || '∞'}`}
                </p>
              )}
            </div>
          )}

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {language === 'en' ? 'Active filters:' : '活躍篩選器：'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <X className="h-4 w-4 mr-1" />
                  {language === 'en' ? 'Clear All' : '清除全部'}
                </Button>
              </div>
              
              {/* Selected Skills Tags */}
              {selectedSkills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedSkills.map((skill, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-red-100"
                      onClick={() => handleSkillToggle(skill)}
                    >
                      {skill}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Projects List */}
        <ProjectList
          status={selectedStatus}
          category={selectedCategory !== "all" ? selectedCategory : undefined}
          skill={selectedSkills.length > 0 ? selectedSkills : undefined}
          sortBy={sortBy}
          budgetMin={budgetMin}
          budgetMax={budgetMax}
          searchQuery={searchQuery}
          hideActions={true}
        />
      </div>
    </section>
  );
}

export default BrowseProjects;