import { projectApi } from "../lib/api";
import { toast } from "sonner";
import { projectId, publicAnonKey } from "../utils/supabase/info";

export function DatabaseSeeder() {
  const { language } = useLanguage();
  const { user, accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // 新增：搜索和刪除特定項目的狀態
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

  const sampleProjects = [
    // 開發與IT - Development & IT
    {
      title: language === 'en' ? "E-commerce Website Development" : "電子商務網站開發",
      description: language === 'en'
        ? "Looking for an experienced full-stack developer to build a modern e-commerce platform with payment integration, inventory management, and user authentication."
        : "尋找經驗豐富的全端開發人員，建立現代化的電子商務平台，包含支付整合、庫存管理和用戶認證。",
      category: "開發與IT",
      budget_min: 5000,
      budget_max: 10000,
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 60 days
      required_skills: ["React", "Node.js", "PostgreSQL", "Payment Gateway"]
    },
    {
      title: language === 'en' ? "Mobile App Development" : "移動應用開發",
      description: language === 'en'
        ? "Need a React Native developer to build a cross-platform mobile app for iOS and Android with real-time chat, push notifications, and offline support."
        : "需要 React Native 開發人員為 iOS 和 Android 構建跨平台移動應用程式，具有即時聊天、推送通知和離線支援。",
      category: "開發與IT",
      budget_min: 8000,
      budget_max: 15000,
      deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days
      required_skills: ["React Native", "Firebase", "iOS", "Android"]
    },

    // 設計與創意 - Design & Creative
    {
      title: language === 'en' ? "Brand Identity Design" : "品牌識別設計",
      description: language === 'en'
        ? "Looking for a creative designer to develop a complete brand identity including logo, color palette, typography, and brand guidelines for our tech startup."
        : "尋找創意設計師為我們的科技新創公司開發完整的品牌識別，包括標誌、色彩方案、字體和品牌指南。",
      category: "設計與創意",
      budget_min: 2000,
      budget_max: 5000,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      required_skills: ["Graphic Design", "Branding", "Illustrator", "Brand Strategy"]
    },
    {
      title: language === 'en' ? "UI/UX Design for Mobile App" : "移動應用的 UI/UX 設計",
      description: language === 'en'
        ? "Seeking a talented UI/UX designer to create an intuitive and visually appealing mobile app interface with user research, wireframes, and high-fidelity mockups."
        : "尋找有才華的 UI/UX 設計師創建直觀且視覺吸引力的移動應用界面，包括用戶研究、線框圖和高保真模型。",
      category: "設計與創意",
      budget_min: 3000,
      budget_max: 6000,
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 45 days
      required_skills: ["Figma", "UI/UX Design", "Mobile Design", "Prototyping"]
    },

    // 寫作與翻譯 - Writing & Translation
    {
      title: language === 'en' ? "Technical Documentation Writer" : "技術文檔撰寫",
      description: language === 'en'
        ? "Need an experienced technical writer to create comprehensive API documentation, user guides, and tutorials for our SaaS product."
        : "需要經驗豐富的技術撰稿人為我們的 SaaS 產品創建全面的 API 文檔、用戶指南和教程。",
      category: "寫作與翻譯",
      budget_min: 2000,
      budget_max: 4000,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      required_skills: ["Technical Writing", "API Documentation", "Markdown", "Content Writing"]
    },

    // 銷售與行銷 - Sales & Marketing
    {
      title: language === 'en' ? "SEO & Content Marketing Strategy" : "SEO 與內容營銷策略",
      description: language === 'en'
        ? "Looking for an SEO expert to develop and implement a comprehensive content marketing strategy to improve our organic search rankings and drive traffic."
        : "尋找 SEO 專家開發和實施全面的內容營銷策略，以提高我們的自然搜索排名並推動流量。",
      category: "銷售與行銷",
      budget_min: 1500,
      budget_max: 3000,
      deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days
      required_skills: ["SEO", "Content Strategy", "Google Analytics", "Digital Marketing"]
    },
    {
      title: language === 'en' ? "Social Media Campaign Management" : "社交媒體活動管理",
      description: language === 'en'
        ? "Need a social media expert to plan and execute a 3-month marketing campaign across Facebook, Instagram, and LinkedIn to increase brand awareness."
        : "需要社交媒體專家在 Facebook、Instagram 和 LinkedIn 上規劃並執行為期 3 個月的營銷活動，以提高品牌知名度。",
      category: "銷售與行銷",
      budget_min: 2500,
      budget_max: 5000,
      deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      required_skills: ["Social Media Marketing", "Facebook Ads", "Instagram Marketing", "Marketing"]
    },

    // 管理與諮詢 - Management & Consulting
    {
      title: language === 'en' ? "Business Process Optimization" : "業務流程優化",
      description: language === 'en'
        ? "Looking for a business consultant to analyze our current operations and recommend process improvements to increase efficiency and reduce costs."
        : "尋找業務顧問分析我們當前的運營並推薦流程改進，以提高效率並降低成本。",
      category: "管理與諮詢",
      budget_min: 3000,
      budget_max: 7000,
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      required_skills: ["Process Optimization", "Business Analysis", "Consulting", "Strategic Planning"]
    },

    // 財務與會計 - Finance & Accounting
    {
      title: language === 'en' ? "Financial Analysis & Reporting" : "財務分析與報告",
      description: language === 'en'
        ? "Need a financial analyst to prepare quarterly financial reports, conduct variance analysis, and create forecasting models for our growing startup."
        : "需要財務分析師準備季度財務報告，進行差異分析，並為我們成長中的新創公司創建預測模型。",
      category: "財務與會計",
      budget_min: 2000,
      budget_max: 4500,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      required_skills: ["Financial Analysis", "Excel", "Accounting", "Financial Reporting"]
    },

    // 法律服務 - Legal Services
    {
      title: language === 'en' ? "Contract Review & Legal Consultation" : "合同審查與法律諮詢",
      description: language === 'en'
        ? "Seeking a legal consultant to review our service contracts, terms of service, and privacy policy to ensure compliance with current regulations."
        : "尋找法律顧問審查我們的服務合同、服務條款和隱私政策，以確保符合現行法規。",
      category: "法律服務",
      budget_min: 1500,
      budget_max: 3500,
      deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      required_skills: ["Contract Law", "Legal Consulting", "Compliance", "Business Law"]
    },

    // 工程與建築 - Engineering & Architecture
    {
      title: language === 'en' ? "Structural Design Review" : "結構設計審查",
      description: language === 'en'
        ? "Need a licensed civil engineer to review and approve structural designs for a commercial building project, ensuring compliance with local building codes."
        : "需要持證土木工程師審查和批准商業建築項目的結構設計，確保符合當地建築規範。",
      category: "工程與建築",
      budget_min: 3000,
      budget_max: 6000,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      required_skills: ["Civil Engineering", "Structural Design", "AutoCAD", "Engineering"]
    },

    // 數據科學 - Data Science
    {
      title: language === 'en' ? "Machine Learning Model Development" : "機器學習模型開發",
      description: language === 'en'
        ? "Looking for a data scientist to develop and deploy machine learning models for customer behavior prediction and recommendation system."
        : "尋找數據科學家開發和部署機器學習模型，用於客戶行為預測和推薦系統。",
      category: "數據科學",
      budget_min: 4000,
      budget_max: 8000,
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      required_skills: ["Python", "Machine Learning", "TensorFlow", "Data Science"]
    },

    // 客服與支援 - Customer Service
    {
      title: language === 'en' ? "Customer Support System Setup" : "客戶支持系統設置",
      description: language === 'en'
        ? "Looking for a customer support specialist to set up and configure our help desk system, create knowledge base articles, and train our support team."
        : "尋找客戶支持專家設置和配置我們的服務台系統，創建知識庫文章，並培訓我們的支持團隊。",
      category: "客服與支援",
      budget_min: 1500,
      budget_max: 3000,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      required_skills: ["Customer Support", "Help Desk", "CRM", "Technical Support"]
    },

    // 教育與培訓 - Education & Training
    {
      title: language === 'en' ? "Corporate Training Program Development" : "企業培訓計劃開發",
      description: language === 'en'
        ? "Need an instructional designer to create a comprehensive employee onboarding and training program with video tutorials, assessments, and learning materials."
        : "需要教學設計師創建全面的員工入職和培訓計劃，包括視頻教程、評估和學習材料。",
      category: "教育與培訓",
      budget_min: 2500,
      budget_max: 5000,
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      required_skills: ["Instructional Design", "Training", "E-Learning", "Course Development"]
    },

    // 健康與醫療 - Health & Medical
    {
      title: language === 'en' ? "Healthcare App Consultation" : "醫療應用諮詢",
      description: language === 'en'
        ? "Seeking a healthcare IT consultant to advise on HIPAA compliance, data security, and best practices for our telemedicine platform."
        : "尋找醫療IT顧問為我們的遠程醫療平台提供HIPAA合規、數據安全和最佳實踐建議。",
      category: "健康與醫療",
      budget_min: 3000,
      budget_max: 6000,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      required_skills: ["Healthcare IT", "HIPAA Compliance", "Medical Software", "Health Tech"]
    }
  ];

  const seedDatabase = async () => {
    if (!user || !accessToken) {
      toast.error(language === 'en' ? 'Please login to seed data' : '請登入以填充數據');
      return;
    }

    setLoading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const project of sampleProjects) {
        try {
          await projectApi.create(project, accessToken);
          successCount++;
          await new Promise(resolve => setTimeout(resolve, 200)); // Rate limiting
        } catch (error) {
          console.error('Error creating project:', error);
          errorCount++;
        }
      }

      if (errorCount === 0) {
        toast.success(
          language === 'en' 
            ? `Successfully created ${successCount} sample projects!` 
            : `成功創建 ${successCount} 個示例項目！`
        );
        setSeeded(true);
      } else {
        toast.warning(
          language === 'en'
            ? `Created ${successCount} projects, ${errorCount} failed`
            : `創建 ${successCount} 個項目，${errorCount} 個失敗`
        );
      }
    } catch (error) {
      console.error('Seeding error:', error);
      toast.error(language === 'en' ? 'Failed to seed database' : '填充數據庫失敗');
    } finally {
      setLoading(false);
    }
  };

  const deleteDatabase = async () => {
    if (!user || !accessToken) {
      toast.error(language === 'en' ? 'Please login to delete data' : '請登入以刪除數據');
      return;
    }

    setDeleteLoading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const project of sampleProjects) {
        try {
          await projectApi.delete(project.title, accessToken);
          successCount++;
          await new Promise(resolve => setTimeout(resolve, 200)); // Rate limiting
        } catch (error) {
          console.error('Error deleting project:', error);
          errorCount++;
        }
      }

      if (errorCount === 0) {
        toast.success(
          language === 'en' 
            ? `Successfully deleted ${successCount} sample projects!` 
            : `成功刪除 ${successCount} 個示例項目！`
        );
        setSeeded(false);
      } else {
        toast.warning(
          language === 'en'
            ? `Deleted ${successCount} projects, ${errorCount} failed`
            : `刪除 ${successCount} 個項目，${errorCount} 個失敗`
        );
      }
    } catch (error) {
      console.error('Deleting error:', error);
      toast.error(language === 'en' ? 'Failed to delete database' : '刪除數據庫失敗');
    } finally {
      setDeleteLoading(false);
    }
  };

  const searchProjects = async () => {
    if (!user || !accessToken) {
      toast.error(language === 'en' ? 'Please login to search projects' : '請登入以搜索項目');
      return;
    }

    if (!searchTerm.trim()) {
      toast.error(language === 'en' ? 'Please enter a search term' : '請輸入搜索關鍵詞');
      return;
    }

    setSearching(true);
    try {
      // 從後端獲取所有項目
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/projects`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const data = await response.json();
      
      // 過濾匹配搜索關鍵詞的項目
      const filtered = data.projects.filter((p: any) => 
        p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );

      setSearchResults(filtered);

      if (filtered.length === 0) {
        toast.info(language === 'en' ? 'No projects found' : '未找到項目');
      } else {
        toast.success(
          language === 'en' 
            ? `Found ${filtered.length} project(s)` 
            : `找到 ${filtered.length} 個項目`
        );
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error(language === 'en' ? 'Failed to search projects' : '搜索項目失敗');
    } finally {
      setSearching(false);
    }
  };

  const deleteProject = async (project: any) => {
    if (!user || !accessToken) {
      toast.error(language === 'en' ? 'Please login to delete project' : '請登入以刪除項目');
      return;
    }

    // 檢查是否為項目擁有者
    if (project.user_id !== user.id) {
      toast.error(
        language === 'en' 
          ? 'You can only delete your own projects' 
          : '您只能刪除自己的項目'
      );
      return;
    }

    if (!window.confirm(
      language === 'en' 
        ? `Are you sure you want to delete "${project.title}"?` 
        : `確定要刪除「${project.title}」嗎？`
    )) {
      return;
    }

    setDeletingProjectId(project.id);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/projects/${project.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete project');
      }

      toast.success(
        language === 'en' 
          ? `Successfully deleted "${project.title}"!` 
          : `成功刪除「${project.title}」！`
      );
      
      // 從搜索結果中移除
      setSearchResults(prev => prev.filter(p => p.id !== project.id));
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(`${language === 'en' ? 'Failed to delete project' : '刪除項目失敗'}: ${error.message}`);
    } finally {
      setDeletingProjectId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 示例數據管理 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            {language === 'en' ? 'Sample Data Seeder' : '示例數據填充器'}
          </CardTitle>
          <CardDescription>
            {language === 'en'
              ? 'Quickly populate the database with sample projects for testing'
              : '快速填充數據庫以進行測試的示例項目'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900">
              {language === 'en'
                ? `This will create ${sampleProjects.length} sample projects in different categories. Perfect for testing the platform!`
                : `這將在不同類別中創建 ${sampleProjects.length} 個示例項目。非常適合測試平台！`}
            </p>
          </div>

          {seeded && (
            <div className="flex items-center gap-2 text-green-600 p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5" />
              <span>
                {language === 'en' 
                  ? 'Database successfully seeded!' 
                  : '數據庫填充成功！'}
              </span>
            </div>
          )}

          {!user && (
            <div className="flex items-center gap-2 text-orange-600 p-4 bg-orange-50 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <span>
                {language === 'en'
                  ? 'Please login as a client to create sample projects'
                  : '請以客戶身份登入以創建示例項目'}
              </span>
            </div>
          )}

          <Button
            onClick={seedDatabase}
            disabled={loading || !user || seeded}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {language === 'en' ? 'Creating Projects...' : '創建項目中...'}
              </>
            ) : seeded ? (
              language === 'en' ? 'Already Seeded' : '已填充'
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                {language === 'en' ? 'Seed Sample Data' : '填充示例數據'}
              </>
            )}
          </Button>

          <Button
            onClick={deleteDatabase}
            disabled={deleteLoading || !user || !seeded}
            variant="destructive"
            className="w-full"
          >
            {deleteLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {language === 'en' ? 'Deleting Projects...' : '刪除項目中...'}
              </>
            ) : !seeded ? (
              language === 'en' ? 'Not Seeded' : '未填充'
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                {language === 'en' ? 'Delete Sample Data' : '刪除示例數據'}
              </>
            )}
          </Button>

          {seeded && (
            <p className="text-sm text-gray-600 text-center">
              {language === 'en'
                ? 'Navigate to Dashboard or Browse Projects to see the sample data'
                : '導航至儀表板或瀏覽項目以查看示例數據'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* 搜索和刪除特定項目 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            {language === 'en' ? 'Search & Delete Projects' : '搜索並刪除項目'}
          </CardTitle>
          <CardDescription>
            {language === 'en'
              ? 'Search for projects by title or description and delete them'
              : '按標題或描述搜索項目並刪除它們'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user && (
            <div className="flex items-center gap-2 text-orange-600 p-4 bg-orange-50 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <span>
                {language === 'en'
                  ? 'Please login to search and delete projects'
                  : '請登入以搜索和刪除項目'}
              </span>
            </div>
          )}

          <div className="flex gap-2">
            <Input
              type="text"
              placeholder={language === 'en' ? 'Search by title (e.g., "撥款")...' : '按標題搜索（例如：「撥款」）...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchProjects()}
              className="flex-1"
            />
            <Button
              onClick={searchProjects}
              disabled={searching || !user}
            >
              {searching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  {language === 'en' ? 'Search' : '搜索'}
                </>
              )}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm">
                  {language === 'en'
                    ? `Found ${searchResults.length} project(s)`
                    : `找到 ${searchResults.length} 個項目`}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchResults([])}
                >
                  {language === 'en' ? 'Clear' : '清除'}
                </Button>
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {searchResults.map(project => (
                  <Card key={project.id} className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm line-clamp-1">{project.title}</h4>
                          <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                            {project.description}
                          </p>
                        </div>
                        <Button
                          variant={project.user_id === user?.id ? "destructive" : "outline"}
                          size="sm"
                          onClick={() => deleteProject(project)}
                          disabled={deletingProjectId === project.id || project.user_id !== user?.id}
                        >
                          {deletingProjectId === project.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-xs">
                          NT$ {project.budget?.toLocaleString() || project.budget_min?.toLocaleString()}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {project.status}
                        </Badge>
                        {project.user_id === user?.id ? (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            {language === 'en' ? 'Your Project' : '您的項目'}
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-600 text-xs">
                            {language === 'en' ? 'Not Your Project' : '非您的項目'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}