import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, Filter, X, Users, Loader2, Code, Palette, PenTool, TrendingUp, Video, Smartphone, BarChart, Headphones, Calculator, Scale, Building2, ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { getTranslation } from "../lib/translations";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { TalentCard } from "./TalentCard";
import { TalentDetailDialog } from "./TalentDetailDialog";
import { DatabaseSetupBanner } from "./DatabaseSetupBanner";
import { SeedTalentData } from "./SeedTalentData";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { fetchWithRetry, parseJsonResponse } from "../lib/apiErrorHandler";
import { Pagination } from "./Pagination";

const categoryIcons = [Code, Palette, PenTool, TrendingUp, Video, Smartphone, BarChart, Headphones, Calculator, Scale, Users, Building2];

interface CategoryInfo {
  title: string;
  description: string;
  count: string;
  iconIndex: number;
}

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone?: string;
  company?: string;
  job_title?: string;
  bio?: string;
  account_type: 'client' | 'freelancer' | string[];
  skills?: string | string[];
  website?: string;
  created_at: string;
  avatar_url?: string;
  subscription_plan?: 'free' | 'pro' | 'enterprise';
  category?: string; // ✅ 新增：主要專業類別
  categories?: string[]; // ✅ 新增：多個專業類別
}

export function TalentDirectory() {
  const { language } = useLanguage();
  const t = getTranslation(language as any).talent;
  const categories = getTranslation(language as any).categories.items;

  const [talents, setTalents] = useState<Profile[]>([]);
  const [filteredTalents, setFilteredTalents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [showLoader, setShowLoader] = useState(false); // 延遲顯示載入器
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedTalent, setSelectedTalent] = useState<Profile | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [tableNotFound, setTableNotFound] = useState(false);
  const [selectedCategoryInfo, setSelectedCategoryInfo] = useState<CategoryInfo | null>(null);
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [talentsExpanded, setTalentsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Extract unique skills from all talents - memoize to prevent recalculation
  const allSkills = useMemo(() => {
    return Array.from(
      new Set(
        talents
          .flatMap(t => {
            if (!t.skills) return [];
            if (typeof t.skills === 'string') {
              return t.skills.split(',').map(s => s.trim());
            }
            if (Array.isArray(t.skills)) {
              return t.skills;
            }
            return [];
          })
          .filter(Boolean)
      )
    ).sort();
  }, [talents]);

  // Load talents from Supabase - useCallback to prevent recreation
  const loadTalents = useCallback(async () => {
    setLoading(true);
    setTableNotFound(false);
    
    // 延遲顯示載入器 - 只有在載入時間超過 300ms 時才顯示
    const loaderTimeout = setTimeout(() => {
      if (loading) setShowLoader(true);
    }, 300);
    
    try {
      const response = await fetchWithRetry(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/profiles/freelancers`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch freelancers');
      }

      const { profiles } = await parseJsonResponse(response);
      console.log('📊 [TalentDirectory] Loaded talents:', {
        count: profiles?.length || 0,
      });
      setTalents(profiles || []);
      setFilteredTalents(profiles || []);
    } catch (error) {
      console.error('Exception loading talents:', error);
      setTalents([]);
      setFilteredTalents([]);
    } finally {
      clearTimeout(loaderTimeout);
      setLoading(false);
      setShowLoader(false);
    }
  }, []);

  useEffect(() => {
    loadTalents();
  }, [loadTalents]);

  // 監聽來自 DevelopmentCategories 的分類篩選事件
  useEffect(() => {
    const handleFilterByCategory = (event: CustomEvent) => {
      const { category, subcategory, skills } = event.detail;
      console.log('🎯 [TalentDirectory] 收到分類篩選事件:', { category, subcategory, skills });
      console.log('🔍 [TalentDirectory] 事件來源: filterTalentsByCategory');
      console.log('📍 [TalentDirectory] 當前位置: TalentDirectory 組件');
      
      // 設置分類篩選為 "Development & IT"
      setSelectedCategory('development & it');
      
      // ✅ 使用技能來進一步篩選
      // 如果有提供技能，設置技能篩選
      if (skills && skills.length > 0) {
        console.log('✅ [TalentDirectory] 套用技能篩選:', skills);
        setSelectedSkills(skills);
      } else {
        // 沒有技能就清空，讓類別篩選生效
        setSelectedSkills([]);
      }
      
      // 展開篩選器和人才列表
      setFiltersExpanded(true);
      setTalentsExpanded(true);
      
      console.log('✅ [TalentDirectory] 已套用分類篩選（模糊匹配模式）');
      console.log('✅ [TalentDirectory] 不會導航到項目頁面！');
      
      // ✅ 確保滾動到人才區域
      setTimeout(() => {
        const talentsSection = document.getElementById('talents');
        if (talentsSection) {
          const offset = -100; // 添加一些偏移量
          const elementPosition = talentsSection.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset + offset;
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
          console.log('✅ [TalentDirectory] 已滾動到人才區域');
        }
      }, 200);
    };

    window.addEventListener('filterTalentsByCategory', handleFilterByCategory as EventListener);
    
    return () => {
      window.removeEventListener('filterTalentsByCategory', handleFilterByCategory as EventListener);
    };
  }, []);

  // 監聽來自 Categories 的導航事件 (12個主要分類卡片)
  useEffect(() => {
    const handleNavigateToTalents = (event: CustomEvent) => {
      const { category, skill } = event.detail;
      console.log('🎯 [TalentDirectory] 收到導航事件:', { category, skill });
      console.log('🔍 [TalentDirectory] 事件來源: navigateToTalents (Categories 組件)');
      
      // 滾動到人才區域
      const talentsSection = document.getElementById('talents');
      if (talentsSection) {
        const offset = -100;
        const elementPosition = talentsSection.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset + offset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
        console.log('✅ [TalentDirectory] 已滾動到人才區域');
      }
      
      // 應用篩選
      if (category) {
        console.log('✅ [TalentDirectory] 套用類別篩選:', category);
        setSelectedCategory(category);
        setSelectedSkills([]); // 清空技能篩選，只用類別
      }
      
      if (skill) {
        console.log('✅ [TalentDirectory] 套用技能篩選:', skill);
        // 找到該技能所屬的類別
        const categoryForSkill = categories.find(cat => 
          cat.skills && cat.skills.includes(skill)
        );
        
        if (categoryForSkill) {
          setSelectedCategory(categoryForSkill.value);
          setSelectedSkills([skill]);
        }
      }
      
      // 展開篩選器和人才列表
      setFiltersExpanded(true);
      setTalentsExpanded(true);
      
      console.log('✅ [TalentDirectory] 已套用篩選並展開列表');
    };

    window.addEventListener('navigateToTalents', handleNavigateToTalents as EventListener);
    
    return () => {
      window.removeEventListener('navigateToTalents', handleNavigateToTalents as EventListener);
    };
  }, [categories]);

  // Filter talents based on search and filters - use useMemo instead of useEffect
  const filteredResults = useMemo(() => {
    let filtered = [...talents];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(talent => {
        const skillsStr = Array.isArray(talent.skills) 
          ? talent.skills.join(',') 
          : (talent.skills || '');
        
        return (
          talent.full_name?.toLowerCase().includes(query) ||
          talent.email.toLowerCase().includes(query) ||
          talent.company?.toLowerCase().includes(query) ||
          talent.job_title?.toLowerCase().includes(query) ||
          skillsStr.toLowerCase().includes(query)
        );
      });
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(talent => {
        // ✅ 優先檢查 Profile 中的 category 或 categories 欄位
        if (talent.category) {
          const talentCategory = talent.category.toLowerCase();
          const selectedCat = selectedCategory.toLowerCase();
          
          // 直接匹配 category value (如 "development", "design")
          if (talentCategory === selectedCat) {
            console.log('✅ [TalentDirectory] Talent matched by profile category:', {
              talentName: talent.full_name,
              category: talent.category
            });
            return true;
          }
        }
        
        // ✅ 檢查多個類別
        if (talent.categories && Array.isArray(talent.categories)) {
          const selectedCat = selectedCategory.toLowerCase();
          const hasMatch = talent.categories.some(cat => cat.toLowerCase() === selectedCat);
          
          if (hasMatch) {
            console.log('✅ [TalentDirectory] Talent matched by profile categories:', {
              talentName: talent.full_name,
              categories: talent.categories
            });
            return true;
          }
        }
        
        // ✅ 如果沒有 category 欄位，則使用關鍵詞匹配（向下兼容）
        const skillsStr = Array.isArray(talent.skills) 
          ? talent.skills.join(',') 
          : (talent.skills || '');
        
        const jobTitle = (talent.job_title || '').toLowerCase();
        const company = (talent.company || '').toLowerCase();
        const bio = (talent.bio || '').toLowerCase();
        const skills = skillsStr.toLowerCase();
        const category = selectedCategory.toLowerCase();
        
        // 標準化類別名稱 - 將所有變體映射到統一的 key
        const normalizeCategoryName = (cat: string): string => {
          const normalized = cat.toLowerCase().trim();
          // Development & IT 的所有變體
          if (normalized.includes('develop') || normalized.includes('開發') || normalized.includes('it')) {
            return 'development';
          }
          // Design & Creative 的所有變體
          if (normalized.includes('design') || normalized.includes('設計') || normalized.includes('creative') || normalized.includes('創意')) {
            return 'design';
          }
          // Marketing & Sales 的所有變體
          if (normalized.includes('market') || normalized.includes('營銷') || normalized.includes('行銷') || normalized.includes('sales') || normalized.includes('銷售')) {
            return 'marketing';
          }
          // Writing & Translation 的所有變體
          if (normalized.includes('writ') || normalized.includes('寫作') || normalized.includes('translat') || normalized.includes('翻譯')) {
            return 'writing';
          }
          // Admin & Customer Support 的所有變體
          if (normalized.includes('admin') || normalized.includes('行政') || normalized.includes('customer') || normalized.includes('客服') || normalized.includes('support')) {
            return 'admin';
          }
          return normalized;
        };
        
        const normalizedCategory = normalizeCategoryName(category);
        
        // 統一的關鍵詞映射表（不分語言）
        const categoryKeywords: { [key: string]: string[] } = {
          'development': [
            // 通用開發關鍵詞（英文）
            'development', 'developer', 'programming', 'programmer', 'software', 'engineer', 'engineering',
            'web', 'mobile', 'it', 'tech', 'technology', 'code', 'coding', 'coder', 'full stack', 'fullstack',
            'full-stack', 'architect', 'technical',
            // 通用開發關鍵詞（中文）
            '開發', '程式', '工程師', '軟體', '軟件', '網頁', '前端', '後端', '全端', '全棧',
            '技術', '代碼', '程序員', '架構', '系統', '應用',
            // 前端技術
            'frontend', 'front-end', 'front end', 'react', 'vue', 'angular', 'javascript', 'typescript', 'html', 'css',
            'next', 'nextjs', 'next.js', 'nuxt', 'svelte', 'jquery', 'bootstrap', 'tailwind', 'sass', 'scss',
            'webpack', 'vite', 'redux', 'ui', 'ux', 'responsive', 'spa',
            // 後端技術
            'backend', 'back-end', 'back end', 'node', 'nodejs', 'node.js', 'python', 'java', 'php', 'ruby', 'go', 'golang',
            'c#', 'c++', 'c++', '.net', 'dotnet', 'django', 'flask', 'spring', 'laravel', 'rails', 'express', 'fastapi',
            'nest', 'nestjs', 'koa', 'hapi', 'asp', 'servlet',
            // 移動開發
            'ios', 'android', 'swift', 'kotlin', 'flutter', 'react native', 'xamarin', 'cordova', 'ionic',
            'mobile development', 'app development', 'mobile app', 'hybrid',
            // 數據庫
            'database', 'sql', 'mysql', 'postgresql', 'postgres', 'mongodb', 'redis', 'oracle', 'nosql',
            'mariadb', 'sqlite', 'cassandra', 'dynamodb', 'firestore', 'supabase', 'db',
            '資料庫', '數據庫',
            // DevOps & 雲端
            'devops', 'aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'k8s', 'jenkins', 'ci/cd',
            'terraform', 'ansible', 'linux', 'unix', 'nginx', 'apache', 'cloud', 'serverless', 'deploy',
            '雲端', '雲', '部署',
            // 數據科學 & AI
            'data', 'analytics', 'ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning',
            'data science', 'data scientist', 'data engineer', 'big data', 'tensorflow', 'pytorch', 'pandas',
            'numpy', 'jupyter', 'kaggle', 'neural network',
            '數據', '資料', '分析', '智能', '學習',
            // 其他技術
            'api', 'rest', 'restful', 'graphql', 'microservices', 'blockchain', 'web3', 'solidity', 'ethereum',
            'testing', 'qa', 'quality assurance', 'automation', 'selenium', 'jest', 'cypress', 'unit test',
            'security', 'cybersecurity', 'penetration testing', 'ethical hacking', 'devops',
            '測試', '安全', '區塊鏈'
          ],
          'design': [
            // 英文關鍵詞
            'design', 'designer', 'creative', 'ui', 'ux', 'ui/ux', 'user interface', 'user experience',
            'graphic', 'visual', 'illustration', 'illustrator', 'photoshop', 'figma', 'sketch', 'adobe',
            'branding', 'logo', 'brand', 'identity', 'web design', 'app design', 'product design',
            'motion', 'animation', 'video', 'editing', '3d', 'modeling', 'rendering',
            'typography', 'color', 'layout', 'wireframe', 'prototype', 'mockup', 'art', 'artist',
            // 中文關鍵詞
            '設計', '設計師', '創意', '美術', '視覺', '平面', '介面', '動畫', '插畫', '品牌',
            '美工', '繪圖', 'ui設計', 'ux設計'
          ],
          'marketing': [
            // 英文關鍵詞
            'marketing', 'sales', 'seo', 'sem', 'advertising', 'digital marketing', 'content marketing',
            'social media', 'facebook', 'instagram', 'linkedin', 'twitter', 'tiktok', 'youtube',
            'email marketing', 'growth', 'analytics', 'google analytics', 'conversion', 'funnel',
            'copywriting', 'content', 'strategy', 'campaign', 'brand management', 'ppc', 'ads',
            'influencer', 'affiliate', 'crm', 'lead generation',
            // 中文關鍵詞
            '營銷', '銷售', '行銷', '廣告', '社群', '文案', '策略', '成長', '推廣', '市場'
          ],
          'writing': [
            // 英文關鍵詞
            'writing', 'writer', 'content', 'copywriting', 'copywriter', 'translation', 'translator',
            'editing', 'editor', 'proofreading', 'technical writing', 'creative writing',
            'blogging', 'article', 'journalism', 'ghost writing', 'localization',
            // 中文關鍵詞
            '寫作', '翻譯', '編輯', '文案', '內容', '撰稿', '筆譯', '口譯', '校對'
          ],
          'admin': [
            // 英文關鍵詞
            'admin', 'administration', 'assistant', 'virtual assistant', 'customer support',
            'customer service', 'help desk', 'support', 'data entry', 'office',
            'scheduling', 'coordination', 'organization', 'clerical', 'receptionist',
            // 中文關鍵詞
            '行政', '客服', '助理', '秘書', '支援', '服務', '文書', '總機'
          ],
        };
        
        const keywords = categoryKeywords[normalizedCategory] || [category];
        
        // 更靈活的匹配：檢查職位、技能、公司、簡介
        const matches = keywords.some(keyword => 
          jobTitle.includes(keyword) || 
          skills.includes(keyword) ||
          company.includes(keyword) ||
          bio.includes(keyword)
        );
        
        // 如果有匹配，記錄日誌以便調試
        if (matches) {
          console.log('✅ [TalentDirectory] Talent matched category:', {
            talentName: talent.full_name,
            jobTitle: talent.job_title,
            category: selectedCategory,
            normalizedCategory: normalizedCategory
          });
        }
        
        return matches;
      });
      
      console.log(`📊 [TalentDirectory] After category filter (${selectedCategory}):`, {
        before: talents.length,
        after: filtered.length,
        filtered: filtered.map(t => ({ name: t.full_name, title: t.job_title }))
      });
    }

    // Skill filter
    if (selectedSkills.length > 0) {
      filtered = filtered.filter(talent => {
        const skillsStr = Array.isArray(talent.skills) 
          ? talent.skills.join(',') 
          : (talent.skills || '');
        
        return selectedSkills.some(skill => 
          skillsStr.toLowerCase().includes(skill.toLowerCase())
        );
      });
    }

    // Priority sorting
    filtered.sort((a, b) => {
      const getPriority = (plan?: 'free' | 'pro' | 'enterprise') => {
        if (plan === 'enterprise') return 3;
        if (plan === 'pro') return 2;
        if (plan === 'free') return 1;
        return 0;
      };

      return getPriority(b.subscription_plan) - getPriority(a.subscription_plan);
    });

    return filtered;
  }, [talents, searchQuery, selectedCategory, selectedSkills]);

  // Update filteredTalents when filteredResults changes
  useEffect(() => {
    setFilteredTalents(filteredResults);
    // 重置到第一頁當篩選條件改變
    setCurrentPage(1);
  }, [filteredResults]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedSkills([]);
    setSelectedCategoryInfo(null);
  };

  const handleCloseCategoryInfo = () => {
    setSelectedCategoryInfo(null);
    setSelectedCategory("all");
  };

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const hasActiveFilters = searchQuery || selectedCategory !== "all" || selectedSkills.length > 0;

  const handleViewProfile = (talent: Profile) => {
    setSelectedTalent(talent);
    setDetailDialogOpen(true);
  };

  return (
    <section id="talents" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="mb-4">{t.title}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t.subtitle}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder={t.search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder={t.filters.category} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="all" value="all">{t.filters.allCategories}</SelectItem>
                  {categories.map((category, index) => (
                    <SelectItem key={index} value={category.value}>
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
                        id="all-talents-skills"
                        checked={selectedSkills.length === allSkills.length && allSkills.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedSkills(allSkills);
                          } else {
                            setSelectedSkills([]);
                          }
                        }}
                      />
                      <label
                        htmlFor="all-talents-skills"
                        className="text-sm font-medium leading-none cursor-pointer flex-1"
                      >
                        {language === 'en' ? 'All Skills' : '所有能'}
                      </label>
                    </div>

                    <div className="border-t pt-2">
                      {allSkills.map((skill, index) => (
                        <div key={index} className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded">
                          <Checkbox
                            id={`talent-skill-${index}`}
                            checked={selectedSkills.includes(skill)}
                            onCheckedChange={() => handleSkillToggle(skill)}
                          />
                          <label
                            htmlFor={`talent-skill-${index}`}
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
          </div>

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

        {/* Results Stats */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-600">
            {t.stats.showing}{' '}
            <span className="font-semibold">{filteredTalents.length}</span>{' '}
            {t.stats.of}{' '}
            <span className="font-semibold">{talents.length}</span>{' '}
            {t.stats.talents}
          </p>
        </div>

        {/* Talents Grid */}
        {showLoader ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">
              {language === 'en' ? 'Loading talents...' : '載入人才中...'}
            </p>
          </div>
        ) : filteredTalents.length === 0 ? (
          <div>
            {/* Show seed data component if no talents exist at all */}
            {talents.length === 0 && !hasActiveFilters && (
              <div className="mb-8">
                <SeedTalentData />
              </div>
            )}
            
            <div className="text-center py-20">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="mb-2 text-gray-900">
                {hasActiveFilters ? t.empty.title : t.empty.noTalents}
              </h3>
              <p className="text-gray-600 mb-6">
                {hasActiveFilters ? t.empty.description : t.empty.noTalentsDescription}
              </p>
              {hasActiveFilters && (
                <Button onClick={clearFilters} variant="outline">
                  {t.filters.clear}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTalents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((talent, index) => {
              // Debug: Check for missing or duplicate IDs
              if (!talent.id) {
                console.error('❌ Talent missing ID at index', index, talent);
              }
              return (
                <TalentCard
                  key={`${talent.id || talent.user_id || talent.email}-${index}`}
                  talent={talent}
                  onViewProfile={() => handleViewProfile(talent)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Talent Detail Dialog */}
      <TalentDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        talent={selectedTalent}
      />

      {/* Database Setup Banner */}
      <DatabaseSetupBanner show={tableNotFound} />

      {/* Pagination */}
      {!loading && filteredTalents.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredTalents.length / itemsPerPage)}
          onPageChange={(page) => {
            setCurrentPage(page);
          }}
          language={language}
          sectionId="talents"
        />
      )}
    </section>
  );
}

export default TalentDirectory;